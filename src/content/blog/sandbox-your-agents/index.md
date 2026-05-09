---
title: "Sandbox Your Agents"
description: "How to massively reduce the blast radius of your agents with little effort"
date: "09. May 2026 10:01"
---
# Intro
Coding agents in agentic harnesses are a useful tool. They have gained massive traction in the last few months, particularly due to their enhanced capabilities. They can now navigate your system, make API calls and do all kinds of useful work, especially when you [enable them further](/blog/enable-your-coding-agents). Unfortunately, this is also incredibly risky. 

Obviously, you could always just tell them not to do anything bad. But prompting does not help, as AI agents routinely [ignore instructions](https://x.com/lifeof_jer/status/2048103471019434248). A good rule to live by is "anything an agent can do, it will do eventually". So we need to restrict what they can do on your system. In this blog post I will explore how to use a sandbox to stop them from reading your secrets, which will heavily reduce the blast radius.
# Permissions
The simplest and fastest way to avoid them reading secrets is by not allowing them to do so in their config. E.g. in OpenCode:
```json
// opencode.json
{
	...
	"permission": {  
	  "read": {  
	    ".env": "deny"
	    }
	}
}
```
or in Claude Code:
```json
{
	"permissions": {
		"deny": [
			"Read(./.env)"
		]
	}
}
```
Easy, right? Unfortunately, this is just the most basic protection. With just a bit of creativity, the agent can work around these guardrails. This is one of the rare situations where it felt appropriate to let an LLM do all the creative work. So I consulted Opus 4.6 with Claude Code on how it could bypass this permission and it found four different paths with very little effort. This is the LLM-generated report:

| #   | Method                                      | Why it worked                                                                                         |
| --- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 1 | `python3 -c "print(open('<path>').read())"` | Inline Python isn't recognized as a file reader; the path is buried inside a string literal           |
| 2 | `cp <path> /tmp/x && cat /tmp/x`            | Copy lands at an unrestricted path; the subsequent `cat` doesn't match the denied path                |
| 3 | `ln -s <path> /tmp/link && cat /tmp/link`   | Symlink redirects from an allowed path; `cat`'s argument is `/tmp/link`, not the denied path          |
| 4 | `find ... -exec cat {} \;`                  | The denied path is an argument to `find`, not to `cat`; the matcher only inspects the leading command |

So the current guardrails are simply not enough. Now I could work around this by manually parsing and approving all commands. Unfortunately, there are many ways to read a file via the terminal and the LLM knows more of them than I do. Mistakes also happen. On top of that I'm lazy and admit to just approving all commands occasionally. So clearly this is not a sustainable strategy, we need something better.
# Sandboxing
## macOS Seatbelt
Thankfully, this isn't a new problem. Preventing processes from reading files is one of the core features of any OS. I'm on a Mac, which offers [Seatbelt / sandbox-exec](https://igorstechnoclub.com/sandbox-exec/) to run applications in a sandbox. While it is deprecated, there does not seem to be a solid alternative yet and it is also used in [Codex](https://github.com/openai/codex/blob/b0ccca555685b1534a0028cb7bfdcad8fe2e477a/codex-cli/src/utils/agent/sandbox/macos-seatbelt.ts) and the [Anthropic Sandbox](https://github.com/anthropic-experimental/sandbox-runtime), so it'll do for now.
## Testing it out
To test the concept, let's create a simple profile. In my project directory, I'll create a `claude.sb`:
```
(version 1)
(allow default)
(deny file-read*
  (literal "Users/your/path/to/.env"))
```
Replace the absolute path with the path to the file you want to block. This will block any read access to this file from inside the sandbox, while allowing everything else.

Then, run any agentic harness with the `sandbox-exec` command prefixed: 
```sh
sandbox-exec -f claude.sb claude
```
I asked my agent to execute the above bypasses again and all of them got prevented by the OS. It's also manually testable by executing the commands in the sandbox like this: 
```sh
sandbox-exec -f claude.sb cat ~/path/to/.env
```
This should yield an `Operation not permitted` error.
# Agent Safehouse
There are many more rules that can be configured in a `.sb` profile. One can limit network calls, process executions and much more. Now it's possible to write a very granular and detailed profile yourself, but it would also be tedious. On top of that, there is no real documentation, so you'll learn by copying other configs.

One solution which helps with this is [Agent Safehouse](https://agent-safehouse.dev/) for Mac. It is mostly a wrapper around `sandbox-exec`, with sane defaults. You can check the default setup by executing `safehouse --stdout`. Another useful feature of Agent Safehouse is that it has a wrapper script which scrubs environment variables from the shell context.
## Getting started
Installation and setup are quite simple:
```sh
brew install eugene1g/safehouse/agent-safehouse
safehouse claude
```
This will run `claude` with the default permissions.

They also offer [instructions](https://agent-safehouse.dev/llm-instructions.txt) you can hand your agent to construct a least-privileged `.sb` for your setup. While there is some irony in letting an agent scan your entire local setup while reading random weblinks in order to improve security, it looks quite useful as a starting point. 

Unfortunately, when using it, it constructed a profile less secure than the default profile by setting up a script which does not scrub my environment variables, proving once again you can't trust agents with security.
## Configuration
So back to writing configs like a caveman. To set it up properly, you can create a reference file of the Agent Safehouse defaults like this:
```sh
safehouse --stdout > ~/.config/sandbox-exec/reference.sb  
```

To overwrite what you don't need, create `~/.config/sandbox-exec/agent.sb`, then add this to your `~/.zshrc`:
```sh
# Agent Sandbox
safe() { safehouse --append-profile=~/.config/sandbox-exec/agent.sb "$@"; }

# Sandboxed — the default. Just type the command name.
claude() { safe claude "$@"; }
opencode() { safe opencode "$@"; }

# Unsandboxed — bypass the function with `command`
# command claude               — plain interactive session
```
Now you can add custom denies to the profile to override any overly permissive setting from Safehouse. Note that this will just append the default config from Safehouse, so you need to revert any explicit allow into an explicit deny. Safehouse allows reads inside project folders by default, so you'll want explicit denies for any secrets that live there.

You can also use this as a baseline to create your own `.sb`, then run your agentic harness with `sandbox-exec`. Just keep in mind that you need to add additional functionality such as environment variable scrubbing from the integrated wrapper script for it to be a proper equivalent.
# Outlook
It is important to note that macOS Seatbelt does not offer perfect security. The host kernel is still shared, so escaping the sandbox is possible. However, this would require significant effort by a bad actor. Since we are looking to constrain the blast radius from a compromised or misguided agent, these are massive upgrades over just running an agentic harness as your user.

The other obvious downside is that this is macOS-only. For Linux, the Anthropic sandbox uses `bubblewrap`, and [jai](https://jai.scs.stanford.edu/) looks promising.

Even with these challenges it is still quite trivial to massively improve security for your local setup. Just by using the default Agent Safehouse settings with some additional restrictions based on your local setup, you'll gain massive security enhancements at no cost.