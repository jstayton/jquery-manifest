/**
 * Manifest v1.0.0
 *
 * A jQuery plugin that greatly improves the user experience in selecting
 * multiple values for a single form field.
 *
 * https://github.com/jstayton/jquery-manifest
 *
 * Copyright 2011 by Justin Stayton
 * Released under the MIT License
 * http://en.wikipedia.org/wiki/MIT_License
 */
(function ($) {
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
      formatRemove: function ($remove, $item) {
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
      marcoPolo: {},
      // Called when an item is added to the list. Return 'false' to prevent
      // the item from being added.
      onAdd: null,
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
      // Key character to separate arbitrary, non-results-list values if
      // the 'required' option is 'false'. Pressing this will add the current
      // input value to the list.
      separator: ',',
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
        onSelect: function (mpData, $mpItem) {
          // Allow for custom callback.
          if (options.marcoPolo.onSelect) {
            options.marcoPolo.onSelect.call(this, mpData, $mpItem);
          }

          // Add the selected Marco Polo item to the Manifest list.
          self._add(mpData, $mpItem);
        },
        required: options.required
      };
    },

    // Key code to key name mapping for easy reference.
    keys: {
      BACKSPACE: 8,
      DELETE: 46,
      LEFT: 37,
      RIGHT: 39
    },

    // Initialize the plugin on an input.
    _create: function () {
      var self = this;

      // Create a more appropriately named alias for the input.
      self.$input = self.element.addClass('mf_input');

      // Create a container to wrap together the input, list, and measure.
      self.$container = $('<div class="mf_container" />');

      // Create an empty list that items will be added to.
      self.$list = $('<ol class="mf_list" />');

      self.$measure = $('<measure class="mf_measure" />');

      // For keeping track of whether a 'mousedown' event has caused an input
      // 'blur' event.
      self.mousedown = false;
      self.mpMousedown = false;

      // Make note of the original input width in case 'destroy' is called.
      self.originalWidth = self.$input.css('width');

      if (self.options.marcoPolo) {
        self._bindMarcoPolo();
      }

      self
        ._bindInput()
        ._bindList()
        ._bindContainer()
        ._bindDocument();

      // Add the list and measure, and wrap them all in the container.
      self.$input
        .wrap(self.$container)
        .before(self.$list)
        .after(self.$measure);

      // Because .wrap() only makes a copy of the wrapper, get the actual
      // container that was inserted into the DOM.
      self.$container = self.$input.parent();

      self
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

    // Get the container element.
    container: function () {
      return this.$container;
    },

    // Get the list element.
    list: function () {
      return this.$list;
    },

    // Add an item to the end of the list. For use internally when the input
    // value needs to be reset.
    _add: function (data, $mpItem) {
      var self = this,
          $input = self.$input;

      self.add(data, $mpItem);

      // If Marco Polo is enabled, use its method to change the input value.
      if (self.options.marcoPolo) {
        $input.marcoPolo('change', '');
      }
      else {
        $input.val('');
      }

      self._resizeInput();

      return self;
    },

    // Add an item to the end of the list.
    add: function (data, $mpItem) {
      var self = this,
          $input = self.$input,
          options = self.options,
          $item = $('<li class="mf_item" />'),
          $remove = $('<a href="#" class="mf_remove" title="Remove" />'),
          $value = $('<input type="hidden" class="mf_value" />'),
          add = true;

      // Store the data with the item for easy access.
      $item.data('manifest', data);

      // Format the HTML display of the item.
      $item.html(options.formatDisplay.call($input, data, $item, $mpItem));

      // Format the HTML display of the remove link.
      $remove.html(options.formatRemove.call($input, $remove, $item));

      if (options.valuesName) {
        $value.attr('name', options.valuesName + '[]');
      }
      // If no custom 'name' is set for the hidden input values, append
      // '_values[]' to the input name as the default.
      else {
        $value.attr('name', $input.attr('name') + '_values[]');
      }

      // Format the hidden value to be submitted for the item.
      $value.val(options.formatValue.call($input, data, $value, $item, $mpItem));

      // Append the remove link and hidden values after the display elements of
      // the item.
      $item.append($remove, $value);

      add = self._trigger('add', [data, $item]);

      if (add !== false) {
        $item.appendTo(self.$list);
      }
    },

    // Remove one or more list items, specifying either jQuery objects or a
    // selector that matches list children.
    remove: function (selector) {
      var self = this,
          $input = self.$input,
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
            remove = true;

        remove = self._trigger('remove', [$item.data('manifest'), $item]);

        if (remove !== false) {
          $item.remove();
        }
      });
    },

    // Remove the elements, events, and functionality of this plugin and return
    // the input to its original state.
    destroy: function () {
      var self = this;

      // Destroy Marco Polo.
      if (self.options.marcoPolo) {
        self.$input.marcoPolo('destroy');
      }

      self.$list.remove();
      self.$measure.remove();
      self.$input
        .unwrap()
        .removeClass('mf_input')
        // Set the input back to its original width.
        .width(self.originalWidth);

      $(document).unbind('.manifest');

      // Parent destroy removes the input's data and events.
      $.Widget.prototype.destroy.apply(self, arguments);
    },

    // Trigger a callback subscribed to via an option or using .bind().
    _trigger: function (name, args) {
      var self = this,
          callbackName = 'on' + name.charAt(0).toUpperCase() + name.slice(1),
          triggerName = self.widgetEventPrefix.toLowerCase() + name.toLowerCase(),
          callback = self.options[callbackName];

      self.element.trigger(triggerName, args);

      return callback && callback.apply(self.element, args);
    },

    // Bind the necessary events for Marco Polo.
    _bindMarcoPolo: function (mpOptions) {
      var self = this,
          $input = self.$input,
          options = self.options;

      // Build the Marco Polo options from existing options if none are passed
      // in. Options required for this plugin to work override custom options.
      if (typeof mpOptions === 'undefined') {
        mpOptions = $.extend({}, options.marcoPolo, self._marcoPoloOptions());
      }

      $input.marcoPolo(mpOptions);

      $input.marcoPolo('list').bind('mousedown.manifest', function () {
        // If arbitrary values are allowed, track for use in document 'mouseup'
        // so the current input value can be added in case the 'mouseup' ends
        // somewhere else.
        if (!options.required) {
          self.mpMousedown = true;
        }
      });

      return self;
    },

    // Bind the necessary events to the input.
    _bindInput: function () {
      var self = this,
          $input = self.$input,
          options = self.options;

      $input
        .bind('keydown.manifest', function (key) {
          self._resizeInput();

          // Keyboard navigation only works without an input value.
          if ($input.val()) {
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
              self._selectPrev();

              break;

            // Select the next item.
            case self.keys.RIGHT:
              self._selectNext();

              break;

            // Any other key removes the selected state from the current item.
            default:
              self._removeSelected();

              break;
          }
        })
        .bind('keypress.manifest', function (key) {
          // If arbitrary values are allowed, add the current input value if
          // the separator key is pressed.
          if (!options.required && key.which === options.separator.charCodeAt()) {
            // Prevent the separator key character from being added to the
            // input value.
            key.preventDefault();

            // Add the current input value if there is any.
            if ($input.val()) {
              self._add($input.val(), null);
            }
          }
        })
        .bind('keyup.manifest', function (key) {
          self._resizeInput();
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
            // event, add the current input value if arbitrary values are
            // allowed.
            if (!self.mpMousedown && !options.required && $input.val()) {
              self._add($input.val(), null);
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
        .delegate('li', 'click', function () {
          self._toggleSelect($(this));
        })
        .delegate('a.mf_remove', 'click', function (event) {
          self.remove($(this).closest('li'));

          event.preventDefault();
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
        if (self.mousedown && !$(event.target).is('li.mf_item, li.mf_item *')) {
          self.mousedown = false;

          self._removeSelected();
        }

        // If a 'mousedown' event starts on a Marco Polo list item, but ends
        // somewhere else, add the current input value if arbitrary values are
        // allowed.
        if (self.mpMousedown && !self.options.required) {
          self.mpMousedown = false;

          if ($input.val()) {
            self._add($input.val(), null);
          }
        }
      });

      return self;
    },

    // Style the measure to match the text style of the input, so that text
    // measurements are pixel precise.
    _styleMeasure: function () {
      var self = this,
          $input = self.$input;

      self.$measure.css({
        fontFamily: $input.css('font-family'),
        fontSize: $input.css('font-size'),
        fontWeight: $input.css('font-weight'),
        left: -9999,
        letterSpacing: $input.css('letter-spacing'),
        position: 'absolute',
        top: -9999,
        whiteSpace: 'nowrap',
        width: 'auto'
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

    // Add the selected state to the specified item.
    _addSelect: function ($item) {
      var self = this;

      if (!$item.length) {
        return self;
      }

      // The current selection is removed to ensure that only one item is
      // selected at a time.
      self._removeSelected();

      $item.addClass('mf_selected');

      self._trigger('select', [$item.data('marcoPolo'), $item]);

      return self;
    },

    // Remove the selected state from the specified item.
    _removeSelect: function ($item) {
      var self = this;

      if (!$item.length) {
        return self;
      }

      $item.removeClass('mf_selected');

      self._trigger('selectRemove', [$item.data('marcoPolo'), $item]);

      return self;
    },

    // Remove the selected state from the currently selected item.
    _removeSelected: function () {
      return this._removeSelect(this._selected());
    },

    // Toggle the selection of the specified item.
    _toggleSelect: function ($item) {
      if ($item.hasClass('mf_selected')) {
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
        $prev = self.$list.children(':last');
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
    }
  });
})(jQuery);
