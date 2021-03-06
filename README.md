# Trump.js - A "Unreact" Library

This library allows developers to efficiently render changes in templates to the DOM with the minimum number DOM manipulations.  Trump.js will also handle events within the template.

## License

TBA.

## Demo and tests

TBA.

## Usage

Include the diffDOM.js file in your HTML like this:
```
<script src="diffDOM.js">
```

Or like this in node/browserify:
```
var diffDOM = require("diff-dom");
```

Then create an instance of diffDOM within the javascript code:
```
dd = new diffDOM();
```

Now you can create a diff to get from dom elementA to dom elementB like this:
```
diff = dd.diff(elementA, elementB);
```

You can now apply this diff like this:
```
dd.apply(elementA, diff);
```
Now elementA will have been changed to be structurally equal to elementB.

### Advanced uses

#### Undo

Continuing on from the previous example, you can also undo a diff, like this:
```
dd.undo(elementA, diff);
```
Now elementA will be what it was like before applying the diff.

#### Remote changes

If you need to move diffs from one machine to another one, you will likely want to send the diffs through a websocket connection or as part of a form submit. In both cases you need to convert the diff to a json string.

To convert a diff to a json string which you can send over the network, do:
```
diffJson = JSON.stringify(diff);
```

On the receiving end you then need to unpack it like this:
```
diff = JSON.parse(diffJson);
```

#### Error handling when patching/applying

Sometimes one may try to patch an elment without knowing whether the patch actually will apply cleanly. This should not be a problem. If diffDOM determines that a patch cannot be executed, it will simple return false. Else it will return true:
```
result = dd.apply(element, diff);

if (result) {
    console.log('no problem!');
} else {
    console.log('diff could not be applied');
}
```
#### Advanced merging of text node changes

diffDOM does not include merging for changes to text nodes. However, it includes hooks so that you can add more advanced handling. Simple overwrite the textDiff function of the diffDOM instance. The functions TEXTDIFF and TEXTPATCH need to be defined in the code:
```
dd = new diffDOM({
    textDiff: function (node, currentValue, expectedValue, newValue) {
        if (currentValue===expectedValue) {
            // The text node contains the text we expect it to contain, so we simple change the text of it to the new value.
            node.data = newValue;
        } else {
            // The text node currently does not contain what we expected it to contain, so we need to merge.
            difference = TEXTDIFF(expectedValue, currentValue);
            node.data = TEXTPATCH(newValue, difference);
        }
        return true;
    }
  });
```

#### Pre and post diff hooks

diffDOM provides extension points before and after virtual and actual diffs, exposing some of the internals of the diff algorithm, and allowing you to make additional decisions based on that information.

```
dd = new diffDOM({
    preVirtualDiffApply: function (info) {
        console.log(info);
    },
    postVirtualDiffApply: function (info) {
        console.log(info);
    },
    preDiffApply: function (info) {
        console.log(info);
    },
    postDiffApply: function (info) {
        console.log(info);
    }
  });
```

Additionally, the _pre_ hooks allow you to shortcircuit the standard behaviour of the diff by returning 'true' from this callback. This will cause the diffApply functions to return prematurely, skipping their standard behaviour.

```
dd = new diffDOM({
    // prevent removal of attributes
    preDiffApply: function (info) {
        if (info.diff.action === 'removeAttribute') {
            console.log("preventing attribute removal");
            return true;
        }
    }
  });
```

#### Outer and Inner diff hooks

diffDOM also provides a way to filter outer diff

```
dd = new diffDOM({
    filterOuterDiff: function(t1, t2, diffs) {
        // can change current outer diffs by returning a new array,
        // or by mutating outerDiffs.
        if (!diffs.length && t1.nodeName == "my-component" && t2.nodeName == t1.nodeName) {
            // will not diff childNodes
            t1.innerDone = true;
        }
    }
});
```

#### Debugging

For debugging you might want to set a max number of diff changes between two elements before diffDOM gives up. To allow for a maximum of 500 differences between elements when diffing, initialize diffDOM like this:
```
dd = new diffDOM({
    debug: true,
    diffcap: 500
  });
```

#### Disable value diff detection

For forms that have been filled out by a user in ways that have changed which value is associated with an input field or which options are checked/selected without
the DOM having been updated, the values are diffed. For use cases in which no changes have been made to any of the form values, one may choose to skip diffing the values. To do this, hand `false` as a third configuration option to diffDOM:
```
dd = new diffDOM({
    valueDiffing: false
  });
```
