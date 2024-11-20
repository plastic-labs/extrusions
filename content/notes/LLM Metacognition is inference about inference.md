---
title: LLM Metacognition is inference about inference
date: 03.26.24
---

For wetware, metacognition is typically defined as ‘thinking about thinking’ or often a catch-all for any ‘higher-level’ cognition.

(In some more specific domains, it's an introspective process, focused on thinking about exclusively _your own_ thinking or a suite of personal learning strategies...all valid within their purview, but too constrained for our purposes.)

In large language models, the synthetic corollary of cognition is inference. So we can reasonably define a metacognitive process in an LLM architecture as any that runs inference on the output of prior inference. That is, inference itself is used as context--_inference about inference_.

It might be instantly injected into the next prompt, stored for later use, or leveraged by another model. This kind of architecture is critical when dealing with user context, since LLMs can run inference about user behavior, then use that synthetic context in the future. Experiments here will be critical to overcome [[Machine learning is fixated on task performance|the machine learning community's fixation on task completion]]. For us at Plastic, one of the most interesting species of metacogntion is [[Loose theory of mind imputations are superior to verbatim response predictions|theory of mind and mimicking that in LLMs]] to form high-fidelity representations of users.

