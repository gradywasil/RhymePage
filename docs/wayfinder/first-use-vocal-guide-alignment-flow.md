# First-use vocal-guide alignment flow

## Question

Can a songwriter understand and complete browser-local alignment without being exposed to the underlying model, permission, and state-machine controls?

## Prototype

[BrowserAlignment.prototype.html](../../src/components/BrowserAlignment.prototype.html) is a no-persistence, clickable demonstration of the flow.

## Resolution

Yes. The approved flow provides one clear next action at a time: opt in to optional voice timing, confirm headphones, download the local model once, start a vocal guide, finish it, review proposed timing, and apply it. Permission and model mechanics are explained in context but are not persistent controls. The songwriter explicitly approved this workflow.
