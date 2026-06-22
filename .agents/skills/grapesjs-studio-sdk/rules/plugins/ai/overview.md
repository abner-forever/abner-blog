---
name: "AI Plugin"
description: "Understand overall AI plugin architecture and responsibilities between UI and backend."
source_url: "https://app.grapesjs.com/docs-sdk/plugins/ai/overview"
metadata:
  tags: grapesjs, studio-sdk, plugins, ai, overview
---


# AI Plugin

|               |              |
| ------------- | ------------ |
| Project types | `web``email` |
| Plan          | Startup plan |

The AI Chat is an intelligent assistant integrated into the Studio SDK editor that helps you create and edit components using natural language. It provides a conversational interface powered by AI to streamline your design workflow.

## Architecture

The plugin is split into two distinct parts.

* The frontend plugin ships with a built-in, ready-to-use layout component (`aiChatPanel`). You can render it anywhere in your editor UI and customize its internal components to match your product experience.
* The backend part provides utilities to create streaming responses and to customize or extend the AI behavior (models, tools, and prompting).

AI Chat is built on top of the [Vercel AI SDK](https://ai-sdk.dev/docs/introduction) so you can tap into its ecosystem of providers, tools, and integrations.

## What's next

* [AI Chat](ai-chat.md): Set up and customize the Studio AI Chat UI.
* [AI Backend](ai-backend.md): Build a custom AI backend on your infrastructure.
