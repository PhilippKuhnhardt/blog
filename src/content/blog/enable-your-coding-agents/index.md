---
title: "Enable Your Coding Agents"
description: "Some custom tools I build to make my coding agents more efficient"
date: "04. May 2026"
---
# Intro 
Agentic engineering, or vibe coding has taken the industry by storm. Everyone is talking about different agentic harnesses, debating about the ideal system prompts and skills, and comparing benchmarks in search of the most intelligent model. The industry has fuelled this hype. Each release is more capable than the last, and higher benchmark scores are always a major selling point.

However, I do think that intelligence is not the most important part of making LLMs better for the average developer. Models are already smart-ish enough. They understand all modern languages, are familiar with any programming concepts and can implement any search algorithm with ease. Yet, they still fall quite flat on some development tasks.

The reason for this is often a lack of tooling. Consider your software development setup. Modern developers have powerful IDEs and plenty of powerful tools for every technology they interact with, as well as a plethora of great documentation and references. Every part of the software development process has an optimized UX based on decades of experience.

Coding agents often lack this tooling. While they can interact with the CLI, their workflow still lacks much of the convenience that modern programmers have when creating, validating, and testing software. Many things that you do as a developer are impossible for an out of the box coding agent. This causes agents to make more mistakes, slows them down, and thus costs you more tokens. Thankfully, as programming is naturally text-based, it is quite easy to close some of these gaps with minimal effort. Although tooling is obviously extremely specific to the languages, frameworks and technologies used, I have created some consistently useful custom tooling for my projects.
# The Basics
The simplest and most straightforward tooling is the one you should already have set up. A linter. A formatter. A well-configured testing suite that can be run with a single command. An isolated development environment so that you have the correct versions of your dependencies installed.
# Building the tool
How you build a tool depends heavily on your agentic harness and your use case. For example. OpenCode natively supports [custom tools](https://opencode.ai/docs/custom-tools), Claude Code expects you to provide an [MCP](https://code.claude.com/docs/en/tools-reference). Alternatively, you can always build a simple CLI, or even just a `.sh`-file that your agent is instructed to use.
# Tools
## API Calls
When developing a backend, API calls are your interface. While there are plenty of ways to test an API in a replicable manner, nothing beats manual testing. You could enable your agents to use `curl`, but this has downsides. If your app has any kind of authentication, you either have to disable it for local testing, which goes against the idea of enabling your agents in the best possible way, or you have to provide your agent with a secret. Secondly, enabling an LLM to make custom outgoing API calls is risky, especially if you providem them with secrets. External communication is one of the legs of the [lethal trifecta](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/) and should be restricted where possible.

Instead, I usually build a custom tool for my agents. This tool usually looks something like this:
```python
from fastmcp import FastMCP
import requests
from typing import Literal
from auth import get_auth
from config import base_url

mcp = FastMCP("api_call_demo")

@mcp.tool
def api_call(method: Literal["GET", "POST", "PUT", "DELETE"], path: str, body: dict = None) -> str:
    token = get_auth()
    headers = {"Authorization": f"Bearer {token}"}
    url = f"{base_url}{path}"
    response = requests.request(method, url, json=body, headers=headers)
    return f"Status: {response.status_code} Body: {response.text}"

if __name__ == "__main__":
    mcp.run()
```

The `get_auth()` function should be read from a file that your agent does not have access to. The great thing about this tool is that it can be adapated to suit your personal project. Want your agent to use multiple users? Just want to allow certain endpoints to be called? Want to censor some information from the response body? Want to test against non-local instances? All in your hands and outside of the context window of your LLM.
## Database Access
This goes hand in hand with your agent being able to make API-calls. Sometimes, in order to find a bug or test a feature, I need them to read or modify the database. If it's a local development DB, I usually just create a user with the necessary permissions and provide the connection details. With the appropriate CLI installed, most LLMs are fluent enough in SQL to find and manipulate the information they need. 
## Frontend Usage
[Playwright](https://playwright.dev/) is a great tool for frontend apps, offering out-of-the-box capabilities such as pre-written`SKILL.md`-files. Playwright's CLI allows agents to easily view and interact with your frontend. They can use Playwright to navigate your running application, take screenshots, and interact with any element of the DOM. This significantly improves their output, as they can identify and resolve issues with functionality, formatting, and styling that are not evident from the source files alone.
## Documentation Access
Although agents can fetch and read documentation from the internet, this has two downsides. First, allowing your agents to fetch relatively dynamic web pages poses a security risk. Second, manually fetching URLs makes it very difficult for your agents to find the necessary information. Consider how often you go directly to the correct documentation page compared to how many times you use the search functionality.

Instead, you can simply download the docs. As most docs are stored in a Git-repo, this is quite easy. For example, you can download the Tailwind docs with a simple sparse checkout:
```sh
git clone --depth 1 --filter=blob:none --sparse \
    https://github.com/tailwindlabs/tailwindcss.com.git lib-docs/tailwind
git -C lib-docs/tailwind sparse-checkout set src/docs
```
This enables your agents to use the `grep` command to find any information they need, even if it is hidden on unexpected pages.
# Closing Remarks
Depending on your individual workflow, there are probably many more ways to make your agents more efficient. Observe what tools you use to develop a feature, then examine whether the UX works for your agent. I have achieved significantly more improvements in the speed, efficiency and quality of coding agents simply by providing them with more information and advanced tools, than optimizing for the latest and best model & `SKILL.md`.