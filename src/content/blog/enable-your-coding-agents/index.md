---
title: "Enable Your Coding Agents"
description: "Some custom tools I build to make my coding agents more efficient"
date: "03. May 2026"
---
# Intro 
Agentic engineering or vibe coding has taken the industry in storm. Everybody is discussing about different agentic harnesses, debating about the ideal system prompts and comparing benchmarks, looking for the most intelligent model. And the industry has been fueling this hype. Each release is more capable than the last and higher numbers on a benchmark are always a major selling point.

The focus is very much on general intelligence and building the smartest, most intelligent model, almost regardless of the cost. Which is understandable if you look at the economics of AI models. Providers are spending billions on data centers and a release cycle without them being one step closer to the magical AGI would be an economical disaster.

However I do think that intelligence is not the most important part of making LLMs better for the average developer right now. Models are already smart-ish enough. They understand all modern languages, are familiar with any programming concept and can implement any well known search algorithm without too much trouble. Yet they still fall quite flat on some development tasks.

The reason for this is often the lack of tooling. Think about your software development setup. The modern developer has a powerful IDE, plenty of powerful tooling for every technology he interacts with such as databases or APIs and a plethora of great documentation and references. Basically every part of the software development process has an optimized UX based on decades of experience.

A coding agent often lacks this tooling. While they can interact with the CLI, their workflow still lacks much of the comfort a modern programmer has to create, validate and test software. Plenty of things you do as developer are even impossible for an out-of-the-box coding agent. This makes agents do more mistakes, it slows them down and thus also costs you more token, which will become more important as providers are increasingly less willing to [subsidize](https://github.blog/news-insights/company-news/github-copilot-is-moving-to-usage-based-billing/) demand. Thankfully as programming is naturally text-based, it is quite easy to close some of the gaps with little effort. While tooling is obviously extremely specific based on your languages, frameworks and technologies, I have created some consistently useful custom tooling for my projects.
# The Basics
The simplest and most straightforwards toolings are the toolings you should already have setup for yourself. A linter. A formatter. A well-configured testing suite that can run with a single command. An isolated development environment so that you have the correct versions of your dependencies installed.
# Building the tool
How you build a tool heavily depends on your agentic harness and your use case. E.g. OpenCode natively supports [custom tools](https://opencode.ai/docs/custom-tools), Claude Code expects you to provide a [MCP](https://code.claude.com/docs/en/tools-reference). Alternatively you can always just build a simple CLI or even just a `.sh`-file your agent is instructed to use.
# API Calls
When developing a backend, API calls are your interface. And while there are plenty of ways to test an API in a replicable manner, nothing beats manually testing it. You could enable your agents to use curl, but this has downsides. If your app has any kind of authentication, you have to either disable it for local testing - which goes against the notion of enabling your agents in the best possible way - or you have to provide your agent with a secret. Second, allowing a LLM to make custom outgoing API calls is risky, double so if you give them your secrets. External communication one of the legs of the [lethal trifecta](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/) and to be restricted where possible.

Instead, I usually build a custom tool for my agents. This tool will usually look somewhat like this:
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

The `get_auth()` function should be read from a file your agent does not have access to. The great part is that this tool is highly adaptable to your personal project. Want your agent to use multiple users? Just want to allow certain endpoints to be called? Want to censor some information from the response body? Want to test against non-local instances? All in your hands, all out of the context window of your LLM.
# Database Access
This goes hand-in-hand with your agent being able to do API-calls. Sometimes for them to find a bug or test a feature I want him to either read or even modify the database. If it's a local development DB I usually just create a user with the specific permissions and hand him the connection details, with the appropriate CLI installed most LLMs are fluent enough in SQL to find and manipulate the information they need. 
# Frontend Usage
For frontend apps, [Playwright](https://playwright.dev/) comes with great capabilities configured out-of-the-box, such as pre-written`SKILL.md`-files. With the Playwright CLI agents can easily see and interact with your frontend. Agents can use Playwright to navigate your running application, take screenshots and interact with any element of the DOM. This heavily improves their output, as they can identify and fix issues with functionality, formatting and styling that are not apparent from the source files alone.
# Documentation Access
While agents can fetch and read documentation from the internet and many libraries providing a well maintained `llm.txt`, this has two downsides. First you need to allow your agents to fetch relatively dynamic web pages, which is a security risk. Second manually fetching URLs makes it very hard for your agents to find the necessary information. Think about how often you directly go to the correct page of documentation against how many times you use the search functionality.

Instead, you can just download the docs. As most docs are stored in a Git-repo, this becomes quite easy, e.g. you can download the Tailwind docs with a simple spare checkout:
```sh
git clone --depth 1 --filter=blob:none --sparse \
    https://github.com/tailwindlabs/tailwindcss.com.git lib-docs/tailwind
git -C lib-docs/tailwind sparse-checkout set src/docs
```
This then enables your agents to use the `grep` command to find any information they need, even if it might be hidden on pages that they did not expect.
# Closing Remarks
There are surely many more ways to make your agents more efficient, depending on your individual workflow. Observe what tooling you use to develop a feature, then examine if the UX works for your agent. I have found significant improvements in the speed, efficiency and quality of coding agents, just by providing them with more information and advanced tooling. While model intelligence is important, I have found greater leaps in capability this way than by yet another minor model generation.