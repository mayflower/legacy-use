def create_analysis_prompt() -> str:
    """Create the analysis prompt incorporating HOW_TO_PROMPT.md instructions"""

    how_to_prompt_instructions = """
# How to Prompt

### Writing Instructions: Prompt Structure

- **Begin with a one-line summary of the process.**
- For **each step**:
    - **UI to expect**:
        - Describe what the model should see *before* continuing.
        - If views tend to be similar and easy to confuse, include instructions on how to **notice if the wrong view is visible**.
    - **Action**:
        - Describe one single action using one tool.
        - Never combine different tool types in the same step.
            - ✅ *Press the key "BACKSPACE" five times*
            - ✅ *Click the "OK" button*
            - ❌ *Press "BACKSPACE" and then type "Hello"*

### Available Tools

These are the predefined tools the model can use to interact with the interface:

- **Type**

    Enters plain text input into a field.

    Example: *Type the text: "Example text"*

- **Press key**

    Simulates pressing a key or shortcut on the keyboard.

    Example: *Press the key: "RETURN"*

    This tool also supports commands like: *Press the key "BACKSPACE" **five times***

- **Click**

    Clicks on an element with the cursor.

    Example: *Click on the "Open" button in the top left toolbar*

    Also available:

    - *Double click*
    - *Right click*
- **Scroll up / Scroll down**

    Scrolls the screen in the corresponding direction.

    Example: *Scroll down on the shopping list on the left*

- **ui_not_as_expected**

    Use this tool **if the UI does not match the expected description**—for example, if the wrong tab is visible, elements are missing, or unexpected popups appear. This prevents the model from performing incorrect or unsafe actions.

    **Example:** *If you notice a popup containing a warning message, use the `ui_not_as_expected` tool.*

- **extract_tool**

    Use this tool at the **end of a process** to return the final result once the expected outcome is confirmed. The model will try to match the format defined in the **response example** section of the API specification.

    **Example:** *Now that the data sheet is visible, return the required price information using the `extract_tool`.*

> 💡 Tip: Whenever possible, prefer using keyboard shortcuts (press key) over mouse interactions (click).  It is more reliable and less dependent on precise layout positioning.

### Using Braces (`{...}`)

You can insert dynamic values into the prompt by using single braces:

- `{documentation_type}`, `{date}`, etc.

These are **placeholders** that will be filled with arguments provided by the **parameter** of the API call during execution. Use the concrete values as default values for the parameters.
"""

    prompt = f"""
You are an expert at analyzing screen recordings and creating automation API definitions.

Analyze the provided video recording of a user interacting with a software application. Your task is to:

1. **Identify the core workflow** - What is the user trying to accomplish?
2. **Break down the steps** - What are the individual actions taken?
3. **Identify dynamic elements** - What parts of the workflow would need to be parameterized? Like text, dates, names, values, etc. the user entered, selected or modified. Make sure to replace the identified parameters with the `{...}` syntax.
4. **Original state** - Describe the original state of the application before the user started the workflow and how to get back to it, meant to be used as a cleanup prompt (not within the regular workflow, nor ui_not_as_expected).

## Analysis Guidelines

- Watch for UI state changes and transitions
- Note any user inputs (text, clicks, selections)
- Identify elements that might vary between executions (dates, names, values), and replace them with the `{...}` syntax in the prompt.
- Pay attention to error conditions or unexpected UI states
- Look for confirmation steps or validation checks

Focus on creating a robust, reusable automation that could handle variations in the workflow while maintaining reliability.

{how_to_prompt_instructions}
"""

    return prompt
