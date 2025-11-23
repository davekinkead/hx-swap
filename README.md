# HX-SWAP

HX-SWAP is a HTMX extension that adds a new swap mechanism of `hx-swap="ids"`. When set, it will replace any client DOM nodes with matching returned nodes (by '#id').

Example ....

```
// client html
<body>
  <header>
    <div id="cart">41</div>
  </header>
  <main>
    <p>The cart count is <span id="counter">41</span></p>
    <button hx-put="/update-cart" hx-swap="ids">Add</button>
  </main>
</body>
```

```
// returned html

<body>
  <div id="cart">41</div>
  <span id="counter">41</span>
</body>
```

This would swap out any matching #id nodes.

