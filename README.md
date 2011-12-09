Manifest
========

A jQuery plugin that adds delight to selecting multiple values for an input.

The _recipients_ field in an email app is a perfect example. You _could_ just
offer a plain text input, requiring the user to manually separate each
recipient with a comma. Removing a recipient, however, is a pain: the user has
to precisely select just the right amount of text, making sure not to
accidentally remove too much or too little. As a discerning developer, you know
the user experience should be better. And it can be, with Manifest.

Developed by [Justin Stayton](http://twitter.com/jstayton) while at
[Monk Development](http://monkdev.com).

*   [Examples](http://jstayton.github.com/jquery-manifest)
*   [Release Notes](https://github.com/jstayton/jquery-manifest/wiki/Release-Notes)

Features
--------

*   **Improved user experience.** The user no longer has to fumble through
    manually separating each value, or selecting precisely the right amount of
    text to remove a value. With Manifest, values can easily be added,
    selected, and removed via mouse or keyboard.
*   **Improved developer experience.** Why manually parse each value from a
    single string when Manifest delivers an array with the values ready to be
    processed?
*   **Autocomplete functionality.**
    [Marco Polo](https://github.com/jstayton/jquery-marcopolo) is built-in to
    provide autocomplete functionality if needed. And it's from the same
    developer as Manifest, so you can trust in the quality of the code and
    integration.
*   **Arbitrary values.** Limit selection strictly to the autocomplete results,
    or allow arbitrary values not returned through autocomplete. Either way,
    it's a simple configuration option.
*   **Complete styling control.** With straightforward markup that's explained
    in detail, you can easily style and modify all of the components to fit
    your needs and aesthetic.
*   **Callbacks for all major events.** Add your own twist when an item is
    added, removed, selected, highlighted, and more.
*   **Maintained.** You can very much believe that this plugin will remain
    bug-free and up-to-date. Any feature requests, bug reports, or feedback you
    submit will be responded to quickly as well.
*   **Documented.** I believe that code is only as useful as its documentation.
    This manifests itself not only in clear and thorough developer
    documentation (below), but also verbose documentation within the code
    itself.

What About Chosen?
------------------

[Chosen](https://github.com/harvesthq/chosen) is a great plugin for jQuery and
Prototype that, while similar to Manifest, is different in a number of ways:

*   Chosen works with a `<select>` element; Manifest works with a text
    `<input>`.
*   Chosen searches the pre-defined `<option>` elements; Manifest has built-in
    autocomplete functionality that requests results from a URL.
*   Chosen doesn't allow arbitrary, non-`<option>` values to be selected;
    Manifest does, with or without autocomplete enabled.

Chosen and Manifest were designed for different cases. If you want to make a
`<select>` element with a lot of options more user-friendly, use Chosen. If you
can't reasonably list out every possible option (like all users in a system),
or you need to allow arbitrary values (like new tags), use Manifest.

Requirements
------------

*   jQuery 1.4.2 or newer.
*   jQuery UI Widget 1.8.14. Included in the minified version.
*   Marco Polo 1.3.2. Included in the minified version.
*   All modern browsers are supported, as well as IE 6 and newer.

Getting Started
---------------

To start, make sure to include both jQuery and Manifest in your HTML:

    <script src="jquery.min.js"></script>
    <script src="jquery.manifest.min.js"></script>

Next, add a text input, if you haven't already:

    <input type="text" id="recipients" name="recipients">

Then attach Manifest to the text input in your JavaScript:

    $('#recipients').manifest({
      marcoPolo: {
        url: '/contacts/search',
        formatItem: function (data) {
          return '"' + data.name + '" (' + data.email + ')';
        }
      }
    });

Notice the `marcoPolo` option object.
[Marco Polo](https://github.com/jstayton/jquery-marcopolo) powers the
autocomplete functionality within Manifest, and the option object allows any of
Marco Polo's options to be configured through Manifest. Be sure to read through
Marco Polo's documentation for how it works and what's possible, including
details on returning results in JSON format from your data source `url`. If you
don't require autocomplete functionality, simply set the `marcoPolo` option to
`false`.

Once you have autocomplete results working through Marco Polo, select a few of
those results for submission. Manifest stores each item value in an array named
after the text input. In the case of this example, the input's name is
`recipients`, so the array of values is named `recipients_values`. If you dump
the values of this array in PHP (`$_POST['recipients_values']`), the results
will look something like this:

    Array
    (
        [0] => "Lindsay Weir" (lweir65@gmail.com)
        [1] => "Bill Haverchuck" (chuckle@yahoo.com)
        [2] => "Daniel Desario" (ddesario@me.com)
    )

Loop through the array and process each value as necessary.

You should now have enough understanding of Manifest to start configuring it
for your specific needs. And when you're ready, consider reading through some
of the more advanced guides:

*   [CSS Starter Template](https://github.com/jstayton/jquery-manifest/wiki/CSS-Starter-Template)
*   [HTML Breakdown](https://github.com/jstayton/jquery-manifest/wiki/HTML-Breakdown)
*   [Adding Initial Values](https://github.com/jstayton/jquery-manifest/wiki/Adding-Initial-Values)

Feedback
--------

Please open an issue to request a feature or submit a bug report. Or even if
you just want to provide some feedback, I'd love to hear. I'm also available on
Twitter as [@jstayton](http://twitter.com/jstayton).

Options
-------

*   **marcoPolo** _object, false_

    Options to pass on to Marco Polo for autocomplete functionality. Set to
    _false_ if such functionality is unnecessary.

    _Default:_ false

    ---------------------------------------------------------------------------
*   **required** _boolean_

    Whether to only allow items to be selected from the autocomplete results
    list when autocomplete is enabled. If _false_, arbitrary, non-results-list
    values can be added when the _separator_ key character is pressed or the
    input is blurred.

    _Default:_ false

    ---------------------------------------------------------------------------
*   **separator** _string, array_

    One or more key characters to separate arbitrary, non-results-list values
    if the _required_ option is _false_. Pressing one of these keys will add
    the current input value to the list. Also used to split the initial input
    value for items (using the first character if multiple are configured).

    _Default:_ ,

    ---------------------------------------------------------------------------
*   **values** _string, object, array_

    One or more initial values to add to the list.

    _Default:_ null

    ---------------------------------------------------------------------------
*   **valuesName** _string, null_

    Name of the hidden input value fields. Do not include _[]_ at the end, as
    that will be added. If unset, the default is to add __values[]_ to the
    input name.

    _Default:_ null

### Callbacks

#### Formatting

*   **formatDisplay** (data, $item, $mpItem) _function_

    Format the display of an item. The returned value is added to _$item_ with
    the class _mf\_item_:

        <li class="mf_item">
          "Lindsay Weir" (lweir65@gmail.com)
          …
        </li>

    _Default:_

        if ($mpItem) {
          return $mpItem.html();
        }
        else {
          return data;
        }

    _Parameters:_

    *   **data** _string, object_ Item data.
    *   **$item** _jQuery object_ List item that will be used for display.
    *   **$mpItem** _jQuery object, null_ Optional Marco Polo selected list
                                          item.

    _this:_ _jQuery object_ Text input (no need to wrap like _$(this)_).

    _Return:_ _string_, _DOM element_, or _jQuery object_ to use as the
              display.

    ---------------------------------------------------------------------------
*   **formatRemove** ($remove, $item) _function_

    Format the display of the remove link included with each item. The returned
    value is added to _$remove_ with the class _mf\_remove_:

        <li class="mf_item">
          …
          <a href="#" class="mf_remove" title="Remove">X</a>
          …
        </li>

    _Default:_

        return 'X';

    _Parameters:_

    *   **$remove** _jQuery object_ Remove link.
    *   **$item** _jQuery object_ List item that will be added.

    _this:_ _jQuery object_ Text input (no need to wrap like _$(this)_).

    _Return:_ _string_, _DOM element_, or _jQuery object_ to use as the
              display.

    ---------------------------------------------------------------------------
*   **formatValue** (data, $value, $item, $mpItem) _function_

    Format the hidden value to be submitted for the item. The returned value is
    set as the value of _$value_ with the class _mf\_value_:

        <li class="mf_item">
          …
          <input type="hidden" class="mf_value" value="lweir65@gmail.com">
        </li>

    _Default:_

        if ($mpItem) {
          return $mpItem.text();
        }
        else {
          return data;
        }

    _Parameters:_

    *   **data** _string, object_ Item data.
    *   **$value** _jQuery object_ Hidden value element that will be added.
    *   **$item** _jQuery object_ List item that will be added.
    *   **$mpItem** _jQuery object, null_ Optional Marco Polo selected list
                                          item.

    _this:_ _jQuery object_ Text input (no need to wrap like _$(this)_).

    _Return:_ _string_ value.

#### Events

*   **onAdd** (data, $item) _function, null_

    Called when an item is added to the list. Return _false_ to prevent the
    item from being added.

    _Default:_ null

    _Parameters:_

    *   **data** _string, object_ Item data.
    *   **$item** _jQuery object_ List item that will be added.

    _this:_ _jQuery object_ Text input (no need to wrap like _$(this)_).

    _Bind:_ You can also bind to the _manifestadd_ event:

        $(selector).bind('manifestadd', function (event, data, $item) { … });

    ---------------------------------------------------------------------------
*   **onChange** (type, data, $item) _function, null_

    Called when an item is added or removed from the list.

    _Default:_ null

    _Parameters:_

    *   **type** _string_ Type of change, either "add" or "remove".
    *   **data** _string, object_ Item data.
    *   **$item** _jQuery object_ List item that will be added.

    _this:_ _jQuery object_ Text input (no need to wrap like _$(this)_).

    _Bind:_ You can also bind to the _manifestadd_ event:

        $(selector).bind('manifestchange', function (event, type, data, $item) { … });

    ---------------------------------------------------------------------------
*   **onHighlight** (data, $item) _function, null_

    Called when an item is highlighted via _mouseover_.

    _Default:_ null

    _Parameters:_

    *   **data** _string, object_ Item data.
    *   **$item** _jQuery object_ List item that's being highlighted.

    _this:_ _jQuery object_ Text input (no need to wrap like _$(this)_).

    _Bind:_ You can also bind to the _manifesthighlight_ event:

        $(selector).bind('manifesthighlight', function (event, data, $item) { … });

    ---------------------------------------------------------------------------
*   **onHighlightRemove** (data, $item) _function, null_

    Called when an item is no longer highlighted via _mouseover_.

    _Default:_ null

    _Parameters:_

    *   **data** _string, object_ Item data.
    *   **$item** _jQuery object_ List item that's no longer highlighted.

    _this:_ _jQuery object_ Text input (no need to wrap like _$(this)_).

    _Bind:_ You can also bind to the _manifesthighlightremove_ event:

        $(selector).bind('manifesthighlightremove', function (event, data, $item) { … });

    ---------------------------------------------------------------------------
*   **onRemove** (data, $item) _function, null_

    Called when an item is removed from the list. Return _false_ to prevent the
    item from being removed.

    _Default:_ null

    _Parameters:_

    *   **data** _string, object_ Item data.
    *   **$item** _jQuery object_ List item that's being removed.

    _this:_ _jQuery object_ Text input (no need to wrap like _$(this)_).

    _Bind:_ You can also bind to the _manifestremove_ event:

        $(selector).bind('manifestremove', function (event, data, $item) { … });

    ---------------------------------------------------------------------------
*   **onSelect** (data, $item) _function, null_

    Called when an item is selected through keyboard navigation or click.

    _Default:_ null

    _Parameters:_

    *   **data** _string, object_ Item data.
    *   **$item** _jQuery object_ List item that's being selected.

    _this:_ _jQuery object_ Text input (no need to wrap like _$(this)_).

    _Bind:_ You can also bind to the _manifestselect_ event:

        $(selector).bind('manifestselect', function (event, data, $item) { … });

    ---------------------------------------------------------------------------
*   **onSelectRemove** (data, $item) _function, null_

    Called when an item is no longer selected.

    _Default:_ null

    _Parameters:_

    *   **data** _string, object_ Item data.
    *   **$item** _jQuery object_ List item that's no longer selected.

    _this:_ _jQuery object_ Text input (no need to wrap like _$(this)_).

    _Bind:_ You can also bind to the _manifestselectremove_ event:

        $(selector).bind('manifestselectremove', function (event, data, $item) { … });

Methods
-------

*   **add**

    Add one or more items to the end of the list.

    _Example:_

        $('#recipients').manifest('add', {
          name: 'Lindsay Weir',
          email: 'lweir65@gmail.com'
        });

    _Parameters:_

    *   **data** _string, object, array_ Item data.
    *   **$mpItem** _jQuery object, null_ Optional Marco Polo selected list
                                          item.

    ---------------------------------------------------------------------------
*   **container**

    Get the container element.

    _Example:_

        $('#recipients').manifest('container');

    ---------------------------------------------------------------------------
*   **destroy**

    Remove the elements, events, and functionality of this plugin and return
    the input to its original state.

    _Example:_

        $('#recipients').manifest('destroy');

    ---------------------------------------------------------------------------
*   **list**

    Get the list element.

    _Example:_

        $('#recipients').manifest('list');

    ---------------------------------------------------------------------------
*   **option**

    Get or set one or more options.

    _Example:_

    Get a specific option:

        $('#recipients').manifest('option', 'separator');

    Get the entire options object:

        $('#recipients').manifest('option');

    Set a specific option:

        $('#recipients').manifest('option', 'separator', '/');

    Set multiple options:

        $('#recipients').manifest('option', {
          separator: '/',
          onSelect: function (data, $item) { … }
        });

    _Parameters:_

    *   **nameOrValue** _string, object_ Optional options to get or set.
    *   **value** _mixed_ Optional option value to set.

    ---------------------------------------------------------------------------
*   **remove**

    Remove one or more list items, specifying either jQuery objects or a
    selector that matches list children.

    _Example:_

        $('#recipients').manifest('remove', ':last');

    _Parameters:_

    *   **selector** _jQuery object, selector_ Specific jQuery list item object
                                               or any selector accepted by
                                               .children().

    ---------------------------------------------------------------------------
*   **values**

    Get an array of the current values.

    _Example:_

        $('#recipients').manifest('values');
