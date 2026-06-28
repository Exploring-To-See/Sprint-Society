import json
from openai import OpenAI
import config
from config import GROQ_BASE_URL, TIERS, MAX_AGENT_ITERATIONS
from agent.tools import TOOL_DEFINITIONS, execute_tool
from agent.system_prompts import build_system_prompt
from database.auth import get_profile
from database.memory import get_chat_history, get_top_insights, store_message, extract_insights
from personalization.store import store as personalization_store
from coaching.cycles import estimate_starting_level, level_block_for_prompt


def get_client() -> OpenAI:
    # Resolve at call time so Streamlit Cloud secrets are always picked up.
    return OpenAI(api_key=config.get_groq_api_key(), base_url=GROQ_BASE_URL)


def _complete(client, model, messages, use_tools: bool):
    """One chat completion. `use_tools=False` omits tools entirely so the model
    answers in plain text (used as a fallback when tool-calling misfires)."""
    kwargs = dict(model=model, messages=messages, temperature=0.7, max_tokens=1024)
    if use_tools:
        kwargs["tools"] = TOOL_DEFINITIONS
        kwargs["tool_choice"] = "auto"
    return client.chat.completions.create(**kwargs)


def format_profile_summary(profile: dict) -> str:
    """Create a concise profile summary for the system prompt."""
    if not profile:
        return "No profile data available."

    five_k = profile.get("recent_5k_time")
    five_k_str = f"{five_k:.1f} min" if five_k else "not recorded"

    return (
        f"Name: (user)\n"
        f"Tier: {profile.get('tier', 'unknown').upper()}\n"
        f"Age: {profile.get('age', '?')} | Gender: {profile.get('gender', '?')}\n"
        f"Height: {profile.get('height_cm', '?')}cm | Weight: {profile.get('weight_kg', '?')}kg\n"
        f"Fitness: {profile.get('fitness_level', '?')} | Experience: {profile.get('running_experience', '?')}\n"
        f"5K time: {five_k_str}\n"
        f"Dream race: {profile.get('dream_race', '?')}\n"
        f"Why they run: {profile.get('running_why', '?')}\n"
        f"Training days/week: {profile.get('training_days', '?')}\n"
        f"Preferred time: {profile.get('preferred_time', '?')}\n"
        f"Bad run response: {profile.get('bad_run_response', '?')}\n"
        f"Injuries: {profile.get('injury_history', [])}"
    )


def run_agent(user_id: int, user_message: str, thread_id: int | None = None) -> dict:
    """
    Main agent loop. Sends user message to Groq with tools, handles tool calls,
    returns final response with metadata about tool usage. Messages are stored
    against `thread_id` so conversations save and load as separate threads.
    """
    client = get_client()
    profile = get_profile(user_id)

    tier = profile.get("tier", "pace") if profile else "pace"
    coach_style = profile.get("coach_style", "energizer") if profile else "energizer"
    model = TIERS.get(tier, TIERS["pace"])["model"]

    profile_summary = format_profile_summary(profile)
    insights = get_top_insights(user_id)

    # Keep the JSON profile snapshot fresh, then continuously learn from this
    # message before building the prompt so the coach reacts in the same turn.
    if profile:
        personalization_store.sync_profile(user_id, profile)
    personalization_store.update_from_message(user_id, user_message, role="user", thread_id=thread_id)
    personalization_block = personalization_store.build_prompt_block(user_id)

    # Per-coach 10-level training cycle: place the runner and guide progression.
    start_level = estimate_starting_level(coach_style, profile)
    current_level = personalization_store.get_training_level(user_id, coach_style, default=start_level)
    cycle_block = level_block_for_prompt(coach_style, current_level)
    personalization_block = (cycle_block + "\n\n" + personalization_block).strip()

    system_prompt = build_system_prompt(
        tier, coach_style, profile_summary, insights, personalization_block
    )

    chat_history = get_chat_history(user_id, thread_id=thread_id)

    messages = [{"role": "system", "content": system_prompt}]
    for msg in chat_history:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": user_message})

    store_message(user_id, "user", user_message, thread_id=thread_id)
    extract_insights(user_id, user_message, role="user")

    tool_calls_made = []
    iterations = 0
    tools_disabled = False

    while iterations < MAX_AGENT_ITERATIONS:
        iterations += 1

        try:
            response = _complete(client, model, messages, use_tools=not tools_disabled)
        except Exception as e:
            # Llama on Groq occasionally emits a malformed text tool-call (e.g.
            # "<function=retrieve_knowledge {...}>") that the server rejects with
            # a 400 tool_use_failed. Disable tools and retry once so the runner
            # still gets a real answer instead of a raw error.
            if not tools_disabled:
                tools_disabled = True
                try:
                    response = _complete(client, model, messages, use_tools=False)
                except Exception as e2:
                    return {
                        "response": "Sorry, I hit a snag generating that. Please try rephrasing or ask again.",
                        "tool_calls": tool_calls_made,
                        "error": True,
                    }
            else:
                return {
                    "response": "Sorry, I hit a snag generating that. Please try rephrasing or ask again.",
                    "tool_calls": tool_calls_made,
                    "error": True,
                }

        choice = response.choices[0]

        if choice.finish_reason == "tool_calls" or (choice.message.tool_calls):
            messages.append(choice.message)

            for tool_call in choice.message.tool_calls:
                func_name = tool_call.function.name
                try:
                    func_args = json.loads(tool_call.function.arguments)
                except json.JSONDecodeError:
                    func_args = {}

                result = execute_tool(func_name, func_args, user_id, thread_id=thread_id)

                tool_calls_made.append({
                    "tool": func_name,
                    "args": func_args,
                    "result": result,
                })

                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": result,
                })
        else:
            final_text = choice.message.content or ""
            store_message(user_id, "assistant", final_text, tool_calls_made if tool_calls_made else None, thread_id=thread_id)
            extract_insights(user_id, final_text, role="assistant")
            personalization_store.log_event(user_id, "assistant_message", {
                "preview": final_text[:160],
                "tools_used": [tc["tool"] for tc in tool_calls_made],
                "thread_id": thread_id,
            })

            return {
                "response": final_text,
                "tool_calls": tool_calls_made,
                "model": model,
                "tier": tier,
                "persona": coach_style,
                "error": False,
            }

    final_text = "I apologize, but I'm having trouble processing your request. Could you rephrase it?"
    store_message(user_id, "assistant", final_text, thread_id=thread_id)
    return {"response": final_text, "tool_calls": tool_calls_made, "error": True}
