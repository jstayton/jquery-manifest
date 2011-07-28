/**
 * Manifest v1.0.0
 *
 * A modern jQuery plugin for building a list of values from an autocomplete
 * input field. An example of such functionality is the recipient list in an
 * email app, which can have multiple email addresses.
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
      // Whether to allow arbitrary, non-result-list values to be added when
      // the 'separator' key character is pressed or the input is blurred.
      required: false,
      // Key character to separate arbitrary, non-result-list values, if
      // allowed. Pressing this will add the current input value to the list.
      separator: ',',
      // Name of the hidden input value fields. Do not include '[]' at the end,
      // as that will be added. If unset, the default is to add '_values[]' to
      // the input name.
      valuesName: null
    },

    // Marco Polo options required for this plugin to work.
    _marcoPoloOptions: function () {
      var self = this,
          $input = self.$input,
          options = self.options;

      return {
        onFocus: function ($mpInput, $mpList) {
          // Allow for custom callback.
          if (options.marcoPolo.onFocus) {
            options.marcoPolo.onFocus.call($mpInput, $mpInput, $mpList);
          }

          self._resizeInput();
        },
        onSelect: function (mpData, $mpItem, $mpInput, $mpList) {
          // Allow for custom callback.
          if (options.marcoPolo.onSelect) {
            options.marcoPolo.onSelect.call($mpInput, mpData, $mpItem, $mpInput, $mpList);
          }

          // Add the selected Marco Polo item to the Manifest list.
          self.add(mpData, $mpItem);

          $mpInput.marcoPolo('change', '');

          self._resizeInput();
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

      self.$measure = self._buildMeasure();

      // For keeping track of whether a 'mousedown' event has caused an input
      // 'blur' event.
      self.mousedown = false;
      self.mpMousedown = false;

      // Make note of the original input width in case 'destroy' is called.
      self.originalWidth = self.$input.css('width');

      // Bind the necessary events.
      self
        ._bindInput()
        ._bindList()
        ._bindMarcoPoloList()
        ._bindContainer()
        ._bindDocument();

      // Add the list and measure, and wrap them all in the container.
      self.$input
        .wrap(self.$container)
        .before(self.$list)
        .after(self.$measure);

      self._resizeInput();
    },

    // Set an option.
    _setOption: function (option, value) {
      switch (option) {
        case 'marcoPolo':
          // Pass changes on to Marco Polo, with the options required for this
          // plugin to work overriding the custom options.
          this.$input.marcoPolo('option', $.extend({}, value, this._marcoPoloOptions()));

          break;

        case 'required':
          this.$input.marcoPolo('option', 'required', value);

          break;

        case 'valuesName':
          // Change the 'name' of all hidden input values currently added to
          // the list.
          this.$list
            .find('input:hidden.mf_value')
            .attr('name', value + '[]');

          break;
      }

      // Required call to the parent where the new option value is saved.
      $.Widget.prototype._setOption.apply(this, arguments);
    },

    // Get the container element.
    container: function () {
      return this.$container;
    },

    // Get the list element.
    list: function () {
      return this.$list;
    },

    // Add an item to the end of the list.
    add: function (data, $mpItem) {
      var $input = this.$input,
          options = this.options,
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
      $item.append($remove, $value)

      if (options.onAdd) {
        // The 'onAdd' callback can prevent the item from being added by
        // returning 'false'.
        add = options.onAdd.call($input, data, $item);
      }

      if (add !== false) {
        $item.appendTo(this.$list);
      }
    },

    // Remove one or more list items, specifying either jQuery objects or a
    // selector that matches list children.
    remove: function (selector) {
      var $input = this.$input,
          options = this.options,
          $items = $(),
          $item = $(),
          remove = true;

      // If the selector is already a jQuery object (or objects), use that.
      if (selector instanceof jQuery) {
        $items = selector;
      }
      // Otherwise, query for the items to remove based on the selector.
      else {
        $items = this.$list.children(selector);
      }

      $items.each(function () {
        $item = $(this);

        if (options.onRemove) {
          // The 'onRemove' callback can prevent the item from being removed by
          // returning 'false'.
          remove = options.onRemove.call($input, $item.data('manifest'), $item);
        }
        else {
          // By default, remove the item.
          remove = true;
        }

        if (remove !== false) {
          $item.remove();
        }
      });
    },

    // Remove the elements, events, and functionality of this plugin and return
    // the input to its original state.
    destroy: function () {
      // Destroy Marco Polo.
      this.$input.marcoPolo('destroy');

      this.$list.remove();
      this.$measure.remove();
      this.$input
        .unwrap()
        .removeClass('mf_input')
        // Set the input back to its original width.
        .width(this.originalWidth);

      $(document).unbind('.manifest');

      // Parent destroy removes the input's data and events.
      $.Widget.prototype.destroy.apply(this, arguments);
    },

    // Build the element to be used to measure the width of the input value.
    _buildMeasure: function () {
      var self = this,
          $input = this.$input;

      // Give the measure the same font/text styles as the input to ensure the
      // value is rendered exactly the same.
      return $('<measure class="mf_measure" />').css({
        fontFamily: $input.css('fontFamily'),
        fontSize: $input.css('fontSize'),
        fontWeight: $input.css('fontWeight'),
        left: -9999,
        letterSpacing: $input.css('letterSpacing'),
        position: 'absolute',
        top: -9999,
        whiteSpace: 'nowrap',
        width: 'auto'
      });
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

    // Bind the necessary events to the input.
    _bindInput: function () {
      var self = this,
          $input = self.$input,
          options = self.options;

      $input
        // The Marco Polo options required for this plugin to work override any
        // custom options.
        .marcoPolo($.extend({}, options.marcoPolo, self._marcoPoloOptions()))
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
              self.add($input.val(), null);

              $input.marcoPolo('change', '');

              self._resizeInput();
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
              self.add($input.val(), null);

              $input.marcoPolo('change', '');

              self._resizeInput();
            }
          }, 1);
        });

      return self;
    },

    // Bind the necessary events to the Marco Polo list.
    _bindMarcoPoloList: function () {
      var self = this,
          // Replace with official Marco Polo method to get the list.
          $mpList = self.$input.next();

      $mpList.bind('mousedown.manifest', function () {
        // If arbitrary values are allowed, track for use in document 'mouseup'
        // so the current input value can be added in case the 'mouseup' ends
        // somewhere else.
        if (!self.options.required) {
          self.mpMousedown = true;
        }
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
            self.add($input.val(), null);

            $input.marcoPolo('change', '');

            self._resizeInput();
          }
        }
      });

      return self;
    },

    // Get the currently highlighted item.
    _highlighted: function () {
      return this.$list.children('li.mf_highlighted');
    },

    // Add the highlighted state to the specified item.
    _addHighlight: function ($item) {
      if (!$item.length) {
        return this;
      }

      // The current highlight is removed to ensure that only one item is
      // highlighted at a time.
      this._removeHighlighted();

      $item.addClass('mf_highlighted');

      if (this.options.onHighlight) {
        this.options.onHighlight.call(this.$input, $item.data('marcoPolo'), $item);
      }

      return this;
    },

    // Remove the highlighted state from the specified item.
    _removeHighlight: function ($item) {
      if (!$item.length) {
        return this;
      }

      $item.removeClass('mf_highlighted');

      if (this.options.onHighlightRemove) {
        this.options.onHighlightRemove.call(this.$input, $item.data('marcoPolo'), $item);
      }

      return this;
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
      if (!$item.length) {
        return this;
      }

      // The current selection is removed to ensure that only one item is
      // selected at a time.
      this._removeSelected();

      $item.addClass('mf_selected');

      if (this.options.onSelect) {
        this.options.onSelect.call(this.$input, $item.data('marcoPolo'), $item);
      }

      return this;
    },

    // Remove the selected state from the specified item.
    _removeSelect: function ($item) {
      if (!$item.length) {
        return this;
      }

      $item.removeClass('mf_selected');

      if (this.options.onSelectRemove) {
        this.options.onSelectRemove.call(this.$input, $item.data('marcoPolo'), $item);
      }

      return this;
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
      var $selected = this._selected(),
          $prev = $();

      // Select the previous item if there's a current selection.
      if ($selected.length) {
        $prev = $selected.prev();
      }
      // Select the last item added to the list if not.
      else {
        $prev = this.$list.children(':last');
      }

      // Only change the current selection if there's a previous item. If the
      // first item in the list is the current selection, it remains selected.
      if ($prev.length) {
        this._addSelect($prev);
      }

      return this;
    },

    // Select the item after the currently selected item.
    _selectNext: function () {
      var $selected = this._selected(),
          $next = $selected.next();

      if ($next.length) {
        return this._addSelect($next);
      }
      // If there's nothing after the currently selected item, remove the
      // current selection, leaving nothing selected.
      else {
        return this._removeSelect($selected);
      }
    },

    // Resize the input to fit the current value with space for the next
    // character.
    _resizeInput: function () {
      var $input = this.$input,
          $measure = this.$measure,
          // Escape all HTML special characters for measuring.
          escapedVal = $input.val()
                         .replace(/&/g, '&amp;')
                         .replace(/\s/g, '&nbsp;')
                         .replace(/</g, '&lt;')
                         .replace(/>/g, '&gt;');

      // '---' adds enough space for whatever the next character may be.
      $measure.html(escapedVal + '---');

      // The measure width now represents the width of the input value with
      // space for the next character.
      $input.width($measure.width());

      return this;
    }
  });
})(jQuery);