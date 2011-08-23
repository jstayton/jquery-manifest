Manifest
========

A modern jQuery plugin for building a list of values from an autocomplete input
field. An example of such functionality is the recipient list in an email app,
which can have multiple email addresses.

*   [Examples](http://jstayton.github.com/jquery-manifest)
*   [Release Notes](https://github.com/jstayton/jquery-manifest/wiki/Release-Notes)

Requirements
------------

*   jQuery 1.4.2 or newer.
*   jQuery UI Widget 1.8.14. Included in the minified version.
*   jQuery Marco Polo 1.3.0. Included in the minified version.
*   All modern browsers are supported, as well as IE 6 and newer.

How it Works
------------

Let's say you're building an email app that allows multiple recipients to be
specified. You _could_ just offer a plain text input field. But, as discerning
developer who wants to offer a better user experience, you want something more
tailored for the job. Manifest is what you're looking for.

The first step to getting started is to include both jQuery and Manifest on the
page:

    <script type="text/javascript" src="jquery.min.js"></script>
    <script type="text/javascript" src="jquery.manifest.min.js"></script>

Next, add a text input field:

    <input type="text" id="recipients" name="recipients" />

Now attach Manifest to the input field:

    $('#recipients').manifest({
      marcoPolo: {
        url: '/contacts/search',
        formatItem: function (data) {
          return '"' + data.name + '" (' + data.email + ')';
        }
      }
    });

At this point, viewing the source of the input field reveals some changes to
the original markup:

    <div class="mf_container">
      <ol class="mf_list" />
      <input type="text" id="recipients" name="recipients" class="mf_input mp_input" autocomplete="off" />
      <measure class="mf_measure" style="…">---</measure>
    </div>
    <ol class="mp_list" />

Don't freak! Let's walk through each line.

*   The input field is given the class _mf\_input_ and wrapped in a container
    _div_. This container now acts as, and should be styled as, the input
    field.
*   An empty, ordered list is created and inserted directly before the input
    field for displaying selected items. This list is given the class
    _mf\_list_.
*   A _measure_ element is created and inserted directly after the input field
    for computing the width of the input field value. This element is hidden
    and only used behind the scenes.
*   Finally, Marco Polo is attached to the input field to provide autocomplete
    functionality. The empty, ordered list after the container _div_ is a
    product of Marco Polo for displaying results.

Speaking of Marco Polo, it's important that you understand how its autocomplete
functionality works, especially how to return JSON from your backend data
source to populate the results list. Rather than repeat it all here, head over
to [Marco Polo on GitHub](https://github.com/jstayton/jquery-marcopolo) for a
complete walkthrough.

That's all the setup necessary in your HTML and JavaScript. Be sure to check
out the [CSS Starter Template](https://github.com/jstayton/jquery-manifest/wiki/CSS-Starter-Template)
for some basic styling and stubs for all of the components, and
[HTML Breakdown](https://github.com/jstayton/jquery-manifest/wiki/HTML-Breakdown)
for a complete look into the HTML markup.

You should now have a working instance of Manifest. Go ahead and select a few
recipients. Each selection is added to the ordered list that was created
directly before the input field:

    <ol class="mf_list">
      <li class="mf_item">
        "Lindsay Weir" (lweir65@gmail.com)
        <a href="#" class="mf_remove" title="Remove">X</a>
        <input type="hidden" class="mf_value" name="recipients_values[]" value="lweir65@gmail.com" />
      </li>
      …
    </ol>

The display text, remove link, and hidden input value can all be formatted
using callback options.

When the form containing the Manifest field is submitted, _recipients\_values_
will contain all of the selected item values (in the case of our example,
recipient email addresses). Simply loop through the array and process each
value as necessary.

And that's it! While this example demonstrates a number of fundamental
concepts, the possibilities extend far beyond the recipient list in an email
app. Really, any input field that accepts multiple values can benefit from the
improved user experience offered by Manifest.

Options
-------

*   **marcoPolo** _object_

    Options to pass on to Marco Polo.

    _Default:_ {}

    ---------------------------------------------------------------------------
*   **required** _boolean_

    Whether to only allow items to be selected from the results list. If
    _false_, arbitrary, non-results-list values can be added when the
    _separator_ key character is pressed or the input is blurred.

    _Default:_ false

    ---------------------------------------------------------------------------
*   **separator** _string_

    Key character to separate arbitrary, non-results-list values if the
    _required_ option is _false_. Pressing this will add the current input
    value to the list.

    _Default:_ ,

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

    _Return:_ _string_, _DOM element_, or _jQuery object_ to use as the
              display.

    ---------------------------------------------------------------------------
*   **formatValue** (data, $value, $item, $mpItem) _function_

    Format the hidden value to be submitted for the item. The returned value is
    set as the value of _$value_ with the class _mf\_value_:

        <li class="mf_item">
          …
          <input type="hidden" class="mf_value" value="lweir65@gmail.com" />
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

    _Return:_ _string_ value.

#### Events

*   **onAdd** (data, $item) _function, null_

    Called when an item is added to the list. Return _false_ to prevent the
    item from being added.

    _Default:_ null

    _Parameters:_

    *   **data** _string, object_ Item data.
    *   **$item** _jQuery object_ List item that will be added.

    _Bind:_ You can also bind to the _manifestadd_ event:

        $(selector).bind('manifestadd', function (event, data, $item) { … });

    ---------------------------------------------------------------------------
*   **onHighlight** (data, $item) _function, null_

    Called when an item is highlighted via _mouseover_.

    _Default:_ null

    _Parameters:_

    *   **data** _string, object_ Item data.
    *   **$item** _jQuery object_ List item that's being highlighted.

    _Bind:_ You can also bind to the _manifesthighlight_ event:

        $(selector).bind('manifesthighlight', function (event, data, $item) { … });

    ---------------------------------------------------------------------------
*   **onHighlightRemove** (data, $item) _function, null_

    Called when an item is no longer highlighted via _mouseover_.

    _Default:_ null

    _Parameters:_

    *   **data** _string, object_ Item data.
    *   **$item** _jQuery object_ List item that's no longer highlighted.

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

    _Bind:_ You can also bind to the _manifestremove_ event:

        $(selector).bind('manifestremove', function (event, data, $item) { … });

    ---------------------------------------------------------------------------
*   **onSelect** (data, $item) _function, null_

    Called when an item is selected through keyboard navigation or click.

    _Default:_ null

    _Parameters:_

    *   **data** _string, object_ Item data.
    *   **$item** _jQuery object_ List item that's being selected.

    _Bind:_ You can also bind to the _manifestselect_ event:

        $(selector).bind('manifestselect', function (event, data, $item) { … });

    ---------------------------------------------------------------------------
*   **onSelectRemove** (data, $item) _function, null_

    Called when an item is no longer selected.

    _Default:_ null

    _Parameters:_

    *   **data** _string, object_ Item data.
    *   **$item** _jQuery object_ List item that's no longer selected.

    _Bind:_ You can also bind to the _manifestselectremove_ event:

        $(selector).bind('manifestselectremove', function (event, data, $item) { … });

Methods
-------

*   **add**

    Add an item to the end of the list.

    _Example:_

        $('#recipients').manifest('add', {
          name: 'Lindsay Weir',
          email: 'lweir65@gmail.com'
        });

    _Parameters:_

    *   **data** _object_ Item data.
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

Feedback
--------

Please open an issue to request a feature or submit a bug report. Or even if
you just want to provide some feedback, I'd love to hear.