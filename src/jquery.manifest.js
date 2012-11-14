/*!
 * <%= pkg.title %> v<%= pkg.version %>
 *
 * <%= pkg.description %>
 *
 * <%= pkg.homepage %>
 *
 * Copyright <%= grunt.template.today('yyyy') %> by <%= pkg.author.name %>
 * Licensed <%= _.pluck(pkg.licenses, 'type').join(', ') %>
 */
(function (factory) {
  'use strict';

  // Register as an AMD module, compatible with script loaders like RequireJS.
  // Source: https://github.com/umdjs/umd/blob/master/jqueryPlugin.js
  if (typeof define === 'function' && define.amd) {
    define(['jquery'], factory);
  }
  else {
    factory(jQuery);
  }
}(function ($, undefined) {
  'use strict';

  // jQuery UI's Widget Factory provides an object-oriented plugin framework
  // that handles the common plumbing tasks.
  $.widget('mf.manifest', {
    // Default options.
    options: {
      // Format the display of an item.
      formatDisplay: function (data, $item, $mpItem) {
        // If a Marco Polo item was selected, use the display HTML.
        if ($mpItem) {
          return $mpItem.html();
        }
        // Otherwise, assume the current input value is being added.
        else {
          return data;
        }
      },
      // Format the display of the remove link included with each item.
      formatRemove: function () {
        return 'X';
      },
      // Format the hidden value to be submitted for the item.
      formatValue: function (data, $value, $item, $mpItem) {
        // If a Marco Polo item was selected, use the display text.
        if ($mpItem) {
          return $mpItem.text();
        }
        // Otherwise, assume the current input value is being added.
        else {
          return data;
        }
      },
      // Options to pass on to Marco Polo.
      marcoPolo: false,
      // Called when an item is added to the list. Return 'false' to prevent
      // the item from being added.
      onAdd: null,
      // Called when an item is added or removed from the list.
      onChange: null,
      // Called when an item is highlighted via 'mouseover'.
      onHighlight: null,
      // Called when an item is no longer highlighted via 'mouseover'.
      onHighlightRemove: null,
      // Called when an item is removed from the list. Return 'false' to
      // prevent the item from being removed.
      onRemove: null,
      // Called when an item is selected through keyboard navigation or click.
      onSelect: null,
      // Called when an item is no longer selected.
      onSelectRemove: null,
      // Whether to only allow items to be selected from the results list. If
      // 'false', arbitrary, non-results-list values can be added when the
      // 'separator' key character is pressed or the input is blurred.
      required: false,
      // One or more key characters or codes to separate arbitrary, non-
      // results-list values if the 'required' option is 'false'. Pressing one
      // of these keys will add the current input value to the list. Also used
      // to split the initial input value and pasted values.
      separator: ',',
      // One or more initial values (string or JSON) to add to the list.
      values: null,
      // Name of the hidden input value fields. Do not include '[]' at the end,
      // as that will be added. If unset, the default is to add '_values[]' to
      // the input name.
      valuesName: null
    },

    // Marco Polo options required for this plugin to work.
    _marcoPoloOptions: function () {
      var self = this,
          options = self.options;

      return {
        onFocus: function () {
          // Allow for custom callback.
          if (options.marcoPolo.onFocus) {
            options.marcoPolo.onFocus.call(this);
          }

          self._resizeInput();
        },
        onRequestAfter: function () {
          // Remove the "busy" indicator class on the container's parent.
          self.$container.parent().removeClass('mf_busy');

          // Allow for custom callback.
          if (options.marcoPolo.onRequestAfter) {
            options.marcoPolo.onRequestAfter.call(this);
          }
        },
        onRequestBefore: function () {
          // Add a class to the container's parent that can be hooked-into by
          // the CSS to show a busy indicator.
          self.$container.parent().addClass('mf_busy');

          // Allow for custom callback.
          if (options.marcoPolo.onRequestBefore) {
            options.marcoPolo.onRequestBefore.call(this);
          }
        },
        onSelect: function (mpData, $mpItem) {
          var add = true;

          // Allow for custom callback.
          if (options.marcoPolo.onSelect) {
            add = options.marcoPolo.onSelect.call(this, mpData, $mpItem);
          }

          // Add the selected Marco Polo item to the Manifest list unless
          // 'onSelect' explicitly returns 'false'.
          if (add !== false) {
            self.add(mpData, $mpItem, true, false);
          }
        },
        required: options.required
      };
    },

    // Key code to key name mapping for easy reference.
    keys: {
      BACKSPACE: 8,
      DELETE: 46,
      DOWN: 40,
      END: 35,
      ENTER: 13,
      HOME: 36,
      LEFT: 37,
      RIGHT: 39,
      UP: 38
    },

    // Initialize the plugin on an input.
    _create: function () {
      var self = this,
          options = self.options,
          originalValue,
          $input;

      // Create a more appropriately named alias for the input.
      self.$input = $input = self.element.addClass('mf_input');

      // The existing input name or a created one. Used for building the ID of
      // other elements.
      self.inputName = 'mf_' + ($input.attr('name') || $.now());

      // Create a container to wrap together the input, list, and measure.
      self.$container = $('<div class="mf_container" />');

      // Create an empty list that items will be added to.
      self.$list = $('<ol class="mf_list" />')
                     .attr({
                      'aria-atomic': 'false',
                      'aria-live': 'polite',
                      'aria-multiselectable': 'true',
                      'id': self.inputName + '_list',
                      'role': 'listbox'
                     });

      self.$measure = $('<span class="mf_measure" />');

      // For keeping track of whether a 'mousedown' event has caused an input
      // 'blur' event.
      self.mousedown = false;
      self.mpMousedown = false;

      // Remember original input attribute values for when 'destroy' is called
      // and the input is returned to its original state.
      self.inputOriginals = {
        'aria-owns': $input.attr('aria-owns'),
        'role': $input.attr('role'),
        'width': $input.css('width')
      };

      if (options.marcoPolo) {
        // To prevent Marco Polo from parsing the input's value — because we
        // want this plugin to parse the value instead — the value is
        // temporarily set to nothing while Marco Polo is bound to the input.
        originalValue = $input.val();

        $input.val('');

        self._bindMarcoPolo();

        // Append the Manifest list ID after the Marco Polo list ID for ARIA.
        $input.attr('aria-owns', $input.attr('aria-owns') + ' ' + self.$list.attr('id'));

        // Now that Marco Polo is bound, the value is added back so that it can
        // be parsed by this plugin for values to add.
        $input.val(originalValue);
      }
      else {
        $input.attr({
          'aria-owns': self.$list.attr('id'),
          'role': 'combobox'
        });
      }

      self
        ._bindInput()
        ._bindList()
        ._bindContainer()
        ._bindDocument();

      // Add the list and measure, and wrap them all in the container.
      $input
        .wrap(self.$container)
        .before(self.$list)
        .after(self.$measure);

      // Because .wrap() only makes a copy of the wrapper, get the actual
      // container that was inserted into the DOM.
      self.$container = $input.parent();

      // Add any initial values to the list.
      if (options.values) {
        self.add(options.values, null, false, true);
      }

      self
        ._addInputValues()
        ._styleMeasure()
        ._resizeInput();
    },

    // Set an option.
    _setOption: function (option, value) {
      var self = this,
          $input = self.$input;

      switch (option) {
        case 'marcoPolo':
          // If Marco Polo is enabled, change the existing instance.
          if (self.options.marcoPolo) {
            if (value) {
              // Pass changes on to Marco Polo, with the options required for
              // this plugin to work overriding the custom options.
              $input.marcoPolo('option', $.extend({}, value, self._marcoPoloOptions()));
            }
            else {
              $input.marcoPolo('destroy');
            }
          }
          // Otherwise, bind Marco Polo with the specified options.
          else if (value) {
            self._bindMarcoPolo($.extend({}, value, self._marcoPoloOptions()));

            // Move the Marco Polo results list outside of and after the
            // container. $input.parent() is used instead of self.$container
            // due to the latter not knowing its location in the DOM.
            $input.marcoPolo('list').insertAfter($input.parent());
          }

          break;

        case 'required':
          if (self.options.marcoPolo) {
            $input.marcoPolo('option', 'required', value);
          }

          break;

        case 'values':
          // Although normally set on initialization, if this option is called
          // later, append the values to the list just like the 'add' method.
          self.add(value, null, false, false);

          break;

        case 'valuesName':
          // Change the 'name' of all hidden input values currently added to
          // the list.
          self.$list
            .find('input:hidden.mf_value')
            .attr('name', value + '[]');

          break;
      }

      // Required call to the parent where the new option value is saved.
      $.Widget.prototype._setOption.apply(self, arguments);
    },

    // Bind the necessary events for Marco Polo.
    _bindMarcoPolo: function (mpOptions) {
      var self = this,
          $input = self.$input,
          options = self.options;

      // Build the Marco Polo options from existing options if none are passed
      // in. Options required for this plugin to work override custom options.
      if (mpOptions === undefined) {
        mpOptions = $.extend({}, options.marcoPolo, self._marcoPoloOptions());
      }

      $input.marcoPolo(mpOptions);

      $input.marcoPolo('list').bind('mousedown.manifest', function () {
        // For use in input 'blur' and document 'mouseup' to make sure the
        // current input value is either added or removed.
        self.mpMousedown = true;
      });

      return self;
    },

    // Bind the necessary events to the input.
    _bindInput: function () {
      var self = this,
          $input = self.$input,
          options = self.options,
          preventMarcoPoloCollision = options.marcoPolo && options.marcoPolo.minChars === 0,
          collisionKeys = [
            self.keys.UP,
            self.keys.DOWN,
            self.keys.HOME,
            self.keys.END
          ];

      $input
        .bind('keydown.manifest', function (key) {
          self._resizeInput();

          // If arbitrary values are allowed, add the current input value if
          // a separator key code (integer) is pressed.
          if (!options.required && self._isSeparator(key.which)) {
            // Prevent the separator key character from being added to the
            // input value.
            key.preventDefault();

            // Add the current input value if there is any.
            if ($input.val()) {
              self.add($input.val(), null, true, false);
            }

            return;
          }

          // Prevent the form from submitting on enter.
          if (key.which === self.keys.ENTER) {
            key.preventDefault();

            return;
          }

          // Keyboard navigation only works without an input value.
          if ($input.val()) {
            return;
          }

          // Keyboard navigation collision occurs with Marco Polo when it's
          // configured to do a search when the input has no characters. The
          // results list is then navigable at the same time as Manifest.
          if (preventMarcoPoloCollision && $.inArray(key.which, collisionKeys) !== -1) {
            return;
          }

          switch (key.which) {
            // Remove the selected item.
            case self.keys.BACKSPACE:
            case self.keys.DELETE:
              var $selected = self._selected();

              if ($selected.length) {
                self.remove($selected);
              }
              else {
                self._selectPrev();
              }

              break;

            // Select the previous item.
            case self.keys.LEFT:
            case self.keys.UP:
              self._selectPrev();

              break;

            // Select the next item.
            case self.keys.RIGHT:
            case self.keys.DOWN:
              self._selectNext();

              break;

            // Select the first item.
            case self.keys.HOME:
              self._selectFirst();

              break;

            // Select the last item.
            case self.keys.END:
              self._selectLast();

              break;

            // Any other key removes the selected state from the current item.
            default:
              self._removeSelected();

              break;
          }
        })
        .bind('keypress.manifest', function (key) {
          // If arbitrary values are allowed, add the current input value if
          // a separator key character (string) is pressed.
          if (!options.required && self._isSeparator(String.fromCharCode(key.which))) {
            // Prevent the separator key character from being added to the
            // input value.
            key.preventDefault();

            // Add the current input value if there is any.
            if ($input.val()) {
              self.add($input.val(), null, true, false);
            }
          }
        })
        .bind('keyup.manifest', function () {
          self._resizeInput();
        })
        .bind('paste.manifest', function () {
          // 1ms timeout ensures the input value contains the pasted value.
          setTimeout(function () {
            self._resizeInput();

            // Split the pasted value by separator and add each value if
            // arbitrary values are allowed.
            if (!options.required && $input.val()) {
              self.add(self._splitBySeparator($input.val()), null, true, false);
            }
          }, 1);
        })
        .bind('blur.manifest', function () {
          // 1ms timeout ensures that whatever 'mousedown' event caused this
          // 'blur' event fires first.
          setTimeout(function () {
            // If a list item 'mousedown' event did not cause this 'blur'
            // event, make sure nothing is left selected.
            if (!self.mousedown) {
              self._removeSelected();
            }

            // If a Marco Polo list 'mousedown' event did not cause this 'blur'
            // event...
            if (!self.mpMousedown) {
              // Marco Polo will clear the input value, requiring a resize.
              if (options.marcoPolo && options.required) {
                self._resizeInput();
              }
              // Add the input value since arbitrary values are allowed.
              else if ($input.val()) {
                self.add($input.val(), null, true, false);
              }
            }
          }, 1);
        });

      return self;
    },

    // Bind the necessary events to the list.
    _bindList: function () {
      var self = this;

      self.$list
        .delegate('li', 'mouseover', function () {
          self._addHighlight($(this));
        })
        .delegate('li', 'mouseout', function () {
          self._removeHighlight($(this));
        })
        .delegate('li', 'mousedown', function () {
          // For use in input 'blur' and document 'mouseup' to make sure
          // nothing is left selected if this 'mousedown' ends elsewhere.
          self.mousedown = true;
        })
        .delegate('li', 'click', function (event) {
          // Remove the item if the remove link is clicked.
          if ($(event.target).is('a.mf_remove')) {
            self._removeSelected();

            self.remove($(this));

            event.preventDefault();
          }
          // Otherwise, toggle the selected state.
          else {
            self._toggleSelect($(this));
          }
        });

      return self;
    },

    // Bind the necessary events to the container.
    _bindContainer: function () {
      var self = this;

      // Focus on the input if a click happens anywhere on the container.
      self.$container.bind('click.manifest', function () {
        self.$input.focus();
      });

      return self;
    },

    // Bind the necessary events to the document.
    _bindDocument: function () {
      var self = this,
          $input = self.$input;

      $(document).bind('mouseup.manifest', function (event) {
        // If a 'mousedown' event starts on a list item, but ends somewhere
        // else, make sure nothing is left selected.
        if (self.mousedown) {
          self.mousedown = false;

          if (!$(event.target).is('li.mf_item, li.mf_item *')) {
            self._removeSelected();
          }
        }

        // If a 'mousedown' event starts on a Marco Polo list item, but ends
        // somewhere else, add the current input value if arbitrary values are
        // allowed.
        if (self.mpMousedown) {
          self.mpMousedown = false;

          if (self.options.required) {
            self._resizeInput();
          }
          else if ($input.val()) {
            self.add($input.val(), null, true, false);
          }
        }
      });

      return self;
    },

    // Get the container element.
    container: function () {
      return this.$container;
    },

    // Get the list element.
    list: function () {
      return this.$list;
    },

    // Add one or more items to the end of the list.
    add: function (data, $mpItem, clearInputValue, initial) {
      var self = this,
          $input = self.$input,
          options = self.options,
          // If only a single item is being added, normalize to an array.
          values = $.isArray(data) ? data : [data],
          value,
          $item = $(),
          $remove = $(),
          $value = $(),
          // Called when deferred formatting callbacks complete.
          buildItem = function(formatDisplay, formatRemove, formatValue) {
            // Format the HTML display of the item.
            $item.html(formatDisplay);

            // Format the HTML display of the remove icon.
            $remove.html(formatRemove);

            // Format the hidden value to be submitted for the item.
            $value.val(formatValue);

            // Append the remove link and hidden values after the display
            // elements of the item.
            $item.append($remove, $value);

            $.when(self._trigger('add', [value, $item, !!initial]))
             .then(function (add) {
               if (add !== false) {
                 $item.appendTo(self.$list);

                 // Sometimes an 'onChange' event shouldn't be fired, like when
                 // initial values are added.
                 if (!initial) {
                   self._trigger('change', ['add', value, $item]);
                 }
               }
             });
          };

      for (var i = 0, length = values.length; i < length; i++) {
        value = values[i];

        // Trim extra spaces, tabs, and newlines from the beginning and end of
        // the value if it's a string.
        if (typeof value === 'string') {
          value = $.trim(value);
        }

        // Don't add if the value is an empty string or object.
        if (!value || ($.isPlainObject(value) && $.isEmptyObject(value))) {
          continue;
        }

        $item = $('<li class="mf_item" role="option" aria-selected="false" />');
        $remove = $('<a href="#" class="mf_remove" title="Remove" />');
        $value = $('<input type="hidden" class="mf_value" />');

        if (options.valuesName) {
          $value.attr('name', options.valuesName + '[]');
        }
        // If no custom 'name' is set for the hidden input values, append
        // '_values[]' to the input name as the default.
        else {
          $value.attr('name', $input.attr('name') + '_values[]');
        }

        // Store the data with the item for easy access.
        $item.data('manifest', value);

        // Formatting callbacks support deferred responses to allow for ajax
        // and other asynchronous requests.
        $.when(options.formatDisplay.call($input, value, $item, $mpItem),
               options.formatRemove.call($input, $remove, $item),
               options.formatValue.call($input, value, $value, $item, $mpItem))
         .then(buildItem);
      }

      if (clearInputValue) {
        self._clearInputValue();
      }
    },

    // Add the input values specified in the 'data-values' attribute (JSON) or
    // standard 'value' attribute (string split with 'separator').
    _addInputValues: function () {
      var self = this,
          $input = self.$input,
          data = $input.data('values'),
          value = $input.val(),
          values = [];

      // First check if the input has a 'data-values' attribute with JSON.
      if (data) {
        values = $.isArray(data) ? data : [data];
      }
      // If not, split the current input value with the 'separator'.
      else if (value) {
        values = self._splitBySeparator(value);
      }

      if (values.length) {
        self.add(values, null, true, true);
      }

      return self;
    },

    // Remove one or more list items, specifying either jQuery objects or a
    // selector that matches list children.
    remove: function (selector) {
      var self = this,
          $items = $();

      // If the selector is already a jQuery object (or objects), use that.
      if (selector instanceof jQuery) {
        $items = selector;
      }
      // Otherwise, query for the items to remove based on the selector.
      else {
        $items = self.$list.children(selector);
      }

      $items.each(function () {
        var $item = $(this),
            data = $item.data('manifest');

        $.when(self._trigger('remove', [data, $item]))
         .then(function (remove) {
           if (remove !== false) {
             if (self._isSelected($item)) {
               self._removeSelect($item);
             }

             $item.remove();

             self._trigger('change', ['remove', data, $item]);
           }
         });
      });
    },

    // Get an array of the current values.
    values: function () {
      var self = this,
          $list = self.$list,
          values = [];

      $list.find('input:hidden.mf_value').each(function () {
        values.push($(this).val());
      });

      return values;
    },

    // Remove the elements, events, and functionality of this plugin and return
    // the input to its original state.
    destroy: function () {
      var self = this,
          $input = self.$input;

      // Destroy Marco Polo.
      if (self.options.marcoPolo) {
        $input.marcoPolo('destroy');
      }

      self.$list.remove();
      self.$measure.remove();
      $input
        .unwrap()
        .removeClass('mf_input')
        // Join the added item values together and set as the input value.
        .val(self._joinWithSeparator(self.values()));

      // Reset the input to its original attribute values.
      $.each(self.inputOriginals, function (attribute, value) {
        if (value === undefined) {
          $input.removeAttr(attribute);
        }
        else {
          $input.attr(attribute, value);
        }
      });

      $(document).unbind('.manifest');

      // Parent destroy removes the input's data and events.
      $.Widget.prototype.destroy.apply(self, arguments);
    },

    // Style the measure to match the text style of the input, so that text
    // measurements are pixel precise.
    _styleMeasure: function () {
      var self = this,
          $input = self.$input;

      self.$measure.css({
        'font-family': $input.css('font-family'),
        'font-size': $input.css('font-size'),
        'font-style': $input.css('font-style'),
        'font-variant': $input.css('font-variant'),
        'font-weight': $input.css('font-weight'),
        'left': -9999,
        'letter-spacing': $input.css('letter-spacing'),
        'position': 'absolute',
        'text-transform': $input.css('text-transform'),
        'top': -9999,
        'white-space': 'nowrap',
        'width': 'auto',
        'word-spacing': $input.css('word-spacing')
      });

      return self;
    },

    // Measure the width of a string of text in the style of the input.
    _measureText: function (text) {
      var $measure = this.$measure,
          escapedText;

      // Escape certain HTML special characters.
      escapedText = text
                      .replace(/&/g, '&amp;')
                      .replace(/\s/g, '&nbsp;')
                      .replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;');

      $measure.html(escapedText);

      return $measure.width();
    },

    // Get the maximum width the input can be resized to without overflowing
    // the container. Takes into account the input's margin, border, padding.
    _maxInputWidth: function () {
      var self = this,
          $container = self.$container,
          $input = self.$input;

      return $container.width() - ($input.outerWidth(true) - $input.width());
    },

    // Resize the input to fit the current value with space for the next
    // character.
    _resizeInput: function () {
      var self = this,
          $input = self.$input,
          textWidth;

      // '---' adds enough space for whatever the next character may be.
      textWidth = self._measureText($input.val() + '---');

      // Set the input's width to the size of the text, making sure not to set
      // it wider than the container.
      $input.width(Math.min(textWidth, self._maxInputWidth()));

      return self;
    },

    // Clear the current value of the input.
    _clearInputValue: function () {
      var self = this,
          $input = self.$input;

      // If Marco Polo is enabled, use its method to change the input value.
      if (self.options.marcoPolo) {
        $input.marcoPolo('change', null);
      }
      else {
        $input.val('');
      }

      self._resizeInput();

      return self;
    },

    // Whether a key code/character is a configured value separator.
    _isSeparator: function (key) {
      var separator = this.options.separator;

      if ($.isArray(separator)) {
        return $.inArray(key, separator) !== -1;
      }
      else {
        return key === separator;
      }
    },

    // Get an array of all separators, optionally limited to only characters.
    _separators: function (onlyChars) {
      var option = this.options.separator,
          separators = $.isArray(option) ? option : [option];

      if (onlyChars) {
        // Filter the separators down to only strings/characters.
        separators = $.grep(separators, function (separator) {
          return typeof separator === 'string';
        });
      }

      return separators;
    },

    // Get the first separator, optionally limited to only characters.
    _firstSeparator: function (onlyChars) {
      return this._separators(onlyChars).shift();
    },

    // Split a string by all character separators.
    _splitBySeparator: function (value) {
      var separators = this._separators(true),
          values = value;

      if (separators.length) {
        // Create a character class regex with all of separators escaped.
        values = value.split(new RegExp('[\\' + separators.join('\\') + ']'));
        values = $.map(values, $.trim);
      }

      return values;
    },

    // Join a string with the first character separator.
    _joinWithSeparator: function (values) {
      var separator = this._firstSeparator(true) || '';

      return values.join(separator + ' ');
    },

    // Get the first item.
    _firstItem: function () {
      return this.$list.children('li:first');
    },

    // Get the last item.
    _lastItem: function () {
      return this.$list.children('li:last');
    },

    // Get the currently highlighted item.
    _highlighted: function () {
      return this.$list.children('li.mf_highlighted');
    },

    // Add the highlighted state to the specified item.
    _addHighlight: function ($item) {
      var self = this;

      if (!$item.length) {
        return self;
      }

      // The current highlight is removed to ensure that only one item is
      // highlighted at a time.
      self._removeHighlighted();

      $item.addClass('mf_highlighted');

      self._trigger('highlight', [$item.data('marcoPolo'), $item]);

      return self;
    },

    // Remove the highlighted state from the specified item.
    _removeHighlight: function ($item) {
      var self = this;

      if (!$item.length) {
        return self;
      }

      $item.removeClass('mf_highlighted');

      self._trigger('highlightRemove', [$item.data('marcoPolo'), $item]);

      return self;
    },

    // Remove the highlighted state from the currently highlighted item.
    _removeHighlighted: function () {
      return this._removeHighlight(this._highlighted());
    },

    // Get the currently selected item.
    _selected: function () {
      return this.$list.children('li.mf_selected');
    },

    // Whether the specified item is currently selected.
    _isSelected: function ($item) {
      return $item.hasClass('mf_selected');
    },

    // Add the selected state to the specified item.
    _addSelect: function ($item) {
      var self = this;

      if (!$item.length) {
        return self;
      }

      // The current selection is removed to ensure that only one item is
      // selected at a time.
      self._removeSelected();

      $item
        .addClass('mf_selected')
        .attr({
          'aria-selected': 'true',
          'id': self.inputName + '_selected'
        });

      self.$list.attr('aria-activedescendant', $item.attr('id'));

      self._trigger('select', [$item.data('marcoPolo'), $item]);

      return self;
    },

    // Remove the selected state from the specified item.
    _removeSelect: function ($item) {
      var self = this;

      if (!$item.length) {
        return self;
      }

      $item
        .removeClass('mf_selected')
        .attr('aria-selected', 'false')
        .removeAttr('id');

      self.$list.removeAttr('aria-activedescendant');

      self._trigger('selectRemove', [$item.data('marcoPolo'), $item]);

      return self;
    },

    // Remove the selected state from the currently selected item.
    _removeSelected: function () {
      return this._removeSelect(this._selected());
    },

    // Toggle the selection of the specified item.
    _toggleSelect: function ($item) {
      if (this._isSelected($item)) {
        return this._removeSelect($item);
      }
      else {
        return this._addSelect($item);
      }
    },

    // Select the item before the currently selected item.
    _selectPrev: function () {
      var self = this,
          $selected = self._selected(),
          $prev = $();

      // Select the previous item if there's a current selection.
      if ($selected.length) {
        $prev = $selected.prev();
      }
      // Select the last item added to the list if not.
      else {
        $prev = self._lastItem();
      }

      // Only change the current selection if there's a previous item. If the
      // first item in the list is the current selection, it remains selected.
      if ($prev.length) {
        self._addSelect($prev);
      }

      return self;
    },

    // Select the item after the currently selected item.
    _selectNext: function () {
      var self = this,
          $selected = self._selected(),
          $next = $selected.next();

      if ($next.length) {
        return self._addSelect($next);
      }
      // If there's nothing after the currently selected item, remove the
      // current selection, leaving nothing selected.
      else {
        return self._removeSelect($selected);
      }
    },

    // Select the first item.
    _selectFirst: function () {
      return this._addSelect(this._firstItem());
    },

    // Select the last item.
    _selectLast: function () {
      return this._addSelect(this._lastItem());
    },

    // Trigger a callback subscribed to via an option or using .bind().
    _trigger: function (name, args) {
      var self = this,
          callbackName = 'on' + name.charAt(0).toUpperCase() + name.slice(1),
          triggerName = self.widgetEventPrefix.toLowerCase() + name.toLowerCase(),
          callback = self.options[callbackName];

      self.element.trigger(triggerName, args);

      return callback && callback.apply(self.element, args);
    }
  });
}));
