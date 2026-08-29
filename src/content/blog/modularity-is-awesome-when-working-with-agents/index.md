---
title: "Modularity is awesome when working with agents"
description: "How modular architecture makes working with coding agents more manageable"
date: "29. August 2026 12:26"
---

# Motivation

For around half a year, I've been going all-in on agentic coding. There have been a lot of hurdles, but the productivity increase is magnificent. I've been building the most ambitious and largest projects of my professional career.

While the speed increase is incredible, there are problems. One concept that has been resonating with me is the concept of [three debts](https://queue.acm.org/detail.cfm?id=3807966), which I learned about from Margaret-Anne Storey. These are technical debt in the code, cognitive debt in our understanding of it, and intent debt between what we wanted and what we built. Using AI to write all of my code has massively increased the accumulation of these debts.

However, these debts aren't a new problem. In fact, reducing and managing these debts is one of the primary goals of the entire discipline of software architecture. I've been reading up on and learning a lot about software architecture and have found it very useful when working with coding agents.

# Modularity

The architectural pattern that I want to focus on in this blog post is modularity. Designing software in a modular manner has massively improved my collaboration and productivity when using coding agents, on both a personal and a team level.

The most important concept of modularity is that modules should be loosely coupled and have high cohesion. There are a lot of ways to achieve this. I'd like to focus on information hiding and dependency inversion.

If you aren't familiar with these concepts, I will provide a small example. Let's build a small NestJS app to track my espresso consumption. I want to track all kinds of beans I've tried and have a journal in which I log taste, my grinder settings and so on.

If you just give this task to AI, it will probably create two services to manage journal entries and beans, then implement the feature. The `JournalService` will probably import everything from the `BeansService`. If you are unlucky, the `BeansService` will also already know about everything from the `JournalService` to, for example, create average ratings for each bean.

To work in a modular manner, you'll instead create two modules: let's call them the beans module and the journal module.

First, one might be tempted to just expose the `BeanService`. However, this would couple the journal module to a lower-level component in the beans module, which might again expose internal implementation details. Instead, the beans module exposes a small interface that a concrete service will implement. This is dependency inversion.

```ts
// bean-reader.ts
export const BEAN_READER = Symbol("BEAN_READER");

export type BeanSummary = {
  id: string;
  name: string;
};

export interface BeanReader {
  findById(beanId: string): Promise<BeanSummary | undefined>;
}
```

The implementation can use all the internal details of the beans module, but callers never need to know about them.

```ts
// bean-reader.service.ts
export class BeanReaderService implements BeanReader {
  constructor(private readonly beans: BeanRepository) {}

  async findById(beanId: string): Promise<BeanSummary | undefined> {
    const bean = await this.beans.findById(beanId);
    if (!bean) return undefined;

    return { id: bean.id, name: bean.name };
  }
}
```

The beans module exports the interface and dto and nothing else. This is the concept of information hiding.

```ts
// beans.module.ts
@Module({
  controllers: [/* ... */],
  providers: [/* ... */],
  exports: [BEAN_READER],
})
export class BeansModule {}
```

The journal module imports `BeanReader` through the beans module's public entry point. Its use cases only know about the interface:

```ts
// journal/application/use-cases.ts
import type { BeanReader } from "../../beans/public.js";

export class RecordEspresso {
  constructor(
    private readonly entries: EspressoEntryRepository,
    private readonly beans: BeanReader,
  ) {}

  async execute(input: RecordEspressoInput) {
    const bean = await this.beans.findById(input.beanId);
    if (!bean) throw new ReferencedBeanNotFoundError(input.beanId);

    // Record the espresso...
  }
}
```

And that's it. This looks small and frankly quite trivial, but it revolutionizes the way you can work with your coding agents. This pattern reduces even the biggest codebase into a manageable number of building blocks. Each module can contain a decent number of files and amount of code, but the only important file is the interface. The codebase goes from an endless blob of generated code to a carefully designed application.

Most languages and frameworks support some form of this. There are also plenty of libraries that generate relationship graphs between modules and test for boundary violations.

# What we gain from this

A big upside is that the entire module can fit in the context window of an LLM. Even cheap LLMs are able to generate a module of 10–20 files with few or no bugs. We can also easily verify the functional correctness of the implementation by testing the interface. Generating or refactoring a module is a matter of minutes and costs basically nothing. And even if some implementation is incredibly screwed up, we can easily write the module from scratch using only the interface and the tests, as they contain no internal implementation details.

We also gain back control of the application. Even for larger applications, the number of modules stays manageable. Reasoning about new features or refactorings is possible again by talking about modules, boundaries and interfaces.

On top of that, pull requests become manageable. I'm not overwhelmed by large PRs with changes to 100+ files. By looking at the changes to the interfaces, I'll be able to quickly understand the impact of the PR and can take a deep dive into the modules that are important.

# Conclusion

Obviously, this is no silver bullet: individual modules can still be buggy, and we can have other, more intricate forms of coupling. Also, designing well-scoped modules, good interfaces and sensible relationships is hard work and not trivial. However, I found this to be the most impactful pattern when writing code with AI.

This pattern directly targets all three debts. Technical debt often stays isolated to a specific module, making it manageable. Cognitive debt is lowered, as it becomes easier to understand the structure of the application. And even intent debt is affected, as the intentional design of modules often sparks interesting discussions about the goals of the application, which can be reflected back into the design.

All in all, this pattern has paid off massively in my projects, helping me leverage the strengths of AI while mitigating the weaknesses of relying on agentic coding.
