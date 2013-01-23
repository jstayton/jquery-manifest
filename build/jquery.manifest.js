/*!
 * jQuery UI Widget 1.8.21
 *
 * Copyright 2012, AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * http://docs.jquery.com/UI/Widget
 */
(function( $, undefined ) {

// jQuery 1.4+
if ( $.cleanData ) {
  var _cleanData = $.cleanData;
  $.cleanData = function( elems ) {
    for ( var i = 0, elem; (elem = elems[i]) != null; i++ ) {
      try {
        $( elem ).triggerHandler( "remove" );
      // http://bugs.jquery.com/ticket/8235
      } catch( e ) {}
    }
    _cleanData( elems );
  };
} else {
  var _remove = $.fn.remove;
  $.fn.remove = function( selector, keepData ) {
    return this.each(function() {
      if ( !keepData ) {
        if ( !selector || $.filter( selector, [ this ] ).length ) {
          $( "*", this ).add( [ this ] ).each(function() {
            try {
              $( this ).triggerHandler( "remove" );
            // http://bugs.jquery.com/ticket/8235
            } catch( e ) {}
          });
        }
      }
      return _remove.call( $(this), selector, keepData );
    });
  };
}

$.widget = function( name, base, prototype ) {
  var namespace = name.split( "." )[ 0 ],
    fullName;
  name = name.split( "." )[ 1 ];
  fullName = namespace + "-" + name;

  if ( !prototype ) {
    prototype = base;
    base = $.Widget;
  }

  // create selector for plugin
  $.expr[ ":" ][ fullName ] = function( elem ) {
    return !!$.data( elem, name );
  };

  $[ namespace ] = $[ namespace ] || {};
  $[ namespace ][ name ] = function( options, element ) {
    // allow instantiation without initializing for simple inheritance
    if ( arguments.length ) {
      this._createWidget( options, element );
    }
  };

  var basePrototype = new base();
  // we need to make the options hash a property directly on the new instance
  // otherwise we'll modify the options hash on the prototype that we're
  // inheriting from
//  $.each( basePrototype, function( key, val ) {
//    if ( $.isPlainObject(val) ) {
//      basePrototype[ key ] = $.extend( {}, val );
//    }
//  });
  basePrototype.options = $.extend( true, {}, basePrototype.options );
  $[ namespace ][ name ].prototype = $.extend( true, basePrototype, {
    namespace: namespace,
    widgetName: name,
    widgetEventPrefix: $[ namespace ][ name ].prototype.widgetEventPrefix || name,
    widgetBaseClass: fullName
  }, prototype );

  $.widget.bridge( name, $[ namespace ][ name ] );
};

$.widget.bridge = function( name, object ) {
  $.fn[ name ] = function( options ) {
    var isMethodCall = typeof options === "string",
      args = Array.prototype.slice.call( arguments, 1 ),
      returnValue = this;

    // allow multiple hashes to be passed on init
    options = !isMethodCall && args.length ?
      $.extend.apply( null, [ true, options ].concat(args) ) :
      options;

    // prevent calls to internal methods
    if ( isMethodCall && options.charAt( 0 ) === "_" ) {
      return returnValue;
    }

    if ( isMethodCall ) {
      this.each(function() {
        var instance = $.data( this, name ),
          methodValue = instance && $.isFunction( instance[options] ) ?
            instance[ options ].apply( instance, args ) :
            instance;
        // TODO: add this back in 1.9 and use $.error() (see #5972)
//        if ( !instance ) {
//          throw "cannot call methods on " + name + " prior to initialization; " +
//            "attempted to call method '" + options + "'";
//        }
//        if ( !$.isFunction( instance[options] ) ) {
//          throw "no such method '" + options + "' for " + name + " widget instance";
//        }
//        var methodValue = instance[ options ].apply( instance, args );
        if ( methodValue !== instance && methodValue !== undefined ) {
          returnValue = methodValue;
          return false;
        }
      });
    } else {
      this.each(function() {
        var instance = $.data( this, name );
        if ( instance ) {
          instance.option( options || {} )._init();
        } else {
          $.data( this, name, new object( options, this ) );
        }
      });
    }

    return returnValue;
  };
};

$.Widget = function( options, element ) {
  // allow instantiation without initializing for simple inheritance
  if ( arguments.length ) {
    this._createWidget( options, element );
  }
};

$.Widget.prototype = {
  widgetName: "widget",
  widgetEventPrefix: "",
  options: {
    disabled: false
  },
  _createWidget: function( options, element ) {
    // $.widget.bridge stores the plugin instance, but we do it anyway
    // so that it's stored even before the _create function runs
    $.data( element, this.widgetName, this );
    this.element = $( element );
    this.options = $.extend( true, {},
      this.options,
      this._getCreateOptions(),
      options );

    var self = this;
    this.element.bind( "remove." + this.widgetName, function() {
      self.destroy();
    });

    this._create();
    this._trigger( "create" );
    this._init();
  },
  _getCreateOptions: function() {
    return $.metadata && $.metadata.get( this.element[0] )[ this.widgetName ];
  },
  _create: function() {},
  _init: function() {},

  destroy: function() {
    this.element
      .unbind( "." + this.widgetName )
      .removeData( this.widgetName );
    this.widget()
      .unbind( "." + this.widgetName )
      .removeAttr( "aria-disabled" )
      .removeClass(
        this.widgetBaseClass + "-disabled " +
        "ui-state-disabled" );
  },

  widget: function() {
    return this.element;
  },

  option: function( key, value ) {
    var options = key;

    if ( arguments.length === 0 ) {
      // don't return a reference to the internal hash
      return $.extend( {}, this.options );
    }

    if  (typeof key === "string" ) {
      if ( value === undefined ) {
        return this.options[ key ];
      }
      options = {};
      options[ key ] = value;
    }

    this._setOptions( options );

    return this;
  },
  _setOptions: function( options ) {
    var self = this;
    $.each( options, function( key, value ) {
      self._setOption( key, value );
    });

    return this;
  },
  _setOption: function( key, value ) {
    this.options[ key ] = value;

    if ( key === "disabled" ) {
      this.widget()
        [ value ? "addClass" : "removeClass"](
          this.widgetBaseClass + "-disabled" + " " +
          "ui-state-disabled" )
        .attr( "aria-disabled", value );
    }

    return this;
  },

  enable: function() {
    return this._setOption( "disabled", false );
  },
  disable: function() {
    return this._setOption( "disabled", true );
  },

  _trigger: function( type, event, data ) {
    var prop, orig,
      callback = this.options[ type ];

    data = data || {};
    event = $.Event( event );
    event.type = ( type === this.widgetEventPrefix ?
      type :
      this.widgetEventPrefix + type ).toLowerCase();
    // the original event may come from any element
    // so we need to reset the target on the new event
    event.target = this.element[ 0 ];

    // copy original event properties over to the new event
    orig = event.originalEvent;
    if ( orig ) {
      for ( prop in orig ) {
        if ( !( prop in event ) ) {
          event[ prop ] = orig[ prop ];
        }
      }
    }

    this.element.trigger( event, data );

    return !( $.isFunction(callback) &&
      callback.call( this.element[0], event, data ) === false ||
      event.isDefaultPrevented() );
  }
};

})( jQuery );

/*!
 * Marco Polo v1.7.5
 *
 * A jQuery autocomplete plugin for the discerning developer.
 *
 * https://github.com/jstayton/jquery-marcopolo
 *
 * Copyright 2013 by Justin Stayton
 * Licensed MIT
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

  // The cache spans all instances and is indexed by URL. This allows different
  // instances to pull the same cached results if their URLs match.
  var cache = {};

  // jQuery UI's Widget Factory provides an object-oriented plugin framework
  // that handles the common plumbing tasks.
  $.widget('mp.marcoPolo', {
    // Default options.
    options: {
      // Whether to cache query results.
      cache: true,
      // Whether to compare the selected item against items displayed in the
      // results list. The selected item is highlighted if a match is found,
      // instead of the first item in the list ('highlight' option must be
      // enabled). Set this option to 'true' if the data is a string;
      // otherwise, specify the data object attribute name to compare on.
      compare: false,
      // Additional data to be sent in the request query string.
      data: {},
      // The number of milliseconds to delay before firing a request after a
      // change is made to the input value.
      delay: 250,
      // Format the raw data that's returned from the ajax request. Useful for
      // further filtering the data or returning the array of results that's
      // embedded deeper in the object.
      formatData: null,
      // Format the text that's displayed when the ajax request fails. Setting
      // this option to 'null' or returning 'false' suppresses the message from
      // being displayed.
      formatError: function () {
        return '<em>Your search could not be completed at this time.</em>';
      },
      // Format the display of each item in the results list.
      formatItem: function (data) {
        return data.title || data.name;
      },
      // Format the text that's displayed when the minimum number of characters
      // (specified with the 'minChars' option) hasn't been reached. Setting
      // this option to 'null' or returning 'false' suppresses the message from
      // being displayed.
      formatMinChars: function (minChars) {
        return '<em>Your search must be at least <strong>' + minChars + '</strong> characters.</em>';
      },
      // Format the text that's displayed when there are no results returned
      // for the requested input value. Setting this option to 'null' or
      // returning 'false' suppresses the message from being displayed.
      formatNoResults: function (q) {
        return '<em>No results for <strong>' + q + '</strong>.</em>';
      },
      // Whether to hide the results list when an item is selected. The results
      // list is still hidden when the input is blurred for any other reason.
      hideOnSelect: true,
      // Whether to automatically highlight an item when the results list is
      // displayed. Usually it's the first item, but it could be the previously
      // selected item if 'compare' is specified.
      highlight: true,
      // Positioning a label over an input is a common design pattern
      // (sometimes referred to as 'overlabel') that unfortunately doesn't
      // work so well with all of the input focus/blur events that occur with
      // autocomplete. With this option, however, the hiding/showing of the
      // label is handled internally to provide a built-in solution to the
      // problem.
      label: null,
      // The minimum number of characters required before a request is fired.
      minChars: 1,
      // Called when the user is finished interacting with the autocomplete
      // interface, not just the text input, which loses and gains focus on a
      // results list mouse click.
      onBlur: null,
      // Called when the input value changes.
      onChange: null,
      // Called when the ajax request fails.
      onError: null,
      // Called when the input field receives focus.
      onFocus: null,
      // Called when the minimum number of characters (specified with the
      // 'minChars' option) hasn't been reached by the end of the 'delay'.
      onMinChars: null,
      // Called when there are no results returned for the request.
      onNoResults: null,
      // Called before the ajax request is made.
      onRequestBefore: null,
      // Called after the ajax request completes (success or error).
      onRequestAfter: null,
      // Called when there are results to be displayed.
      onResults: null,
      // Called when an item is selected from the results list or passed in
      // through the 'selected' option.
      onSelect: function (data) {
        this.val(data.title || data.name);
      },
      // The name of the query string parameter that is set with the input
      // value.
      param: 'q',
      // Whether to clear the input value when no selection is made from the
      // results list.
      required: false,
      // The list items to make selectable.
      selectable: '*',
      // Prime the input with a selected item.
      selected: null,
      // Whether to allow the browser's default behavior of submitting the form
      // on ENTER.
      submitOnEnter: false,
      // The URL to GET request for the results.
      url: null
    },

    // Key code to key name mapping for easy reference.
    keys: {
      DOWN: 40,
      END: 35,
      ENTER: 13,
      ESC: 27,
      HOME: 36,
      TAB: 9,
      UP: 38
    },

    // Initialize the plugin on an input.
    _create: function () {
      var self = this,
          $input;

      // Create a more appropriately named alias for the input.
      self.$input = $input = self.element.addClass('mp_input');

      // The existing input name or a created one. Used for building the ID of
      // other elements.
      self.inputName = 'mp_' + ($input.attr('name') || $.now());

      // Create an empty list for displaying future results. Insert it directly
      // after the input element.
      self.$list = $('<ol class="mp_list" />')
                     .attr({
                       'aria-atomic': 'true',
                       'aria-busy': 'false',
                       'aria-live': 'polite',
                       'id': self.inputName + '_list',
                       'role': 'listbox'
                     })
                     .hide()
                     .insertAfter(self.$input);

      // Remember original input attribute values for when 'destroy' is called
      // and the input is returned to its original state.
      self.inputOriginals = {
        'aria-activedescendant': $input.attr('aria-activedescendant'),
        'aria-autocomplete': $input.attr('aria-autocomplete'),
        'aria-expanded': $input.attr('aria-expanded'),
        'aria-labelledby': $input.attr('aria-labelledby'),
        'aria-owns': $input.attr('aria-owns'),
        'aria-required': $input.attr('aria-required'),
        'autocomplete': $input.attr('autocomplete'),
        'role': $input.attr('role')
      };

      // Set plugin-specific attributes.
      $input.attr({
        'aria-autocomplete': 'list',
        'aria-owns': self.$list.attr('id'),
        'autocomplete': 'off',
        'role': 'combobox'
      });

      // The ajax request to get results is stored in case the request needs to
      // be aborted before a response is returned.
      self.ajax = null;
      self.ajaxAborted = false;

      // A reference to this function is maintained for unbinding in the
      // 'destroy' method. This is necessary because the selector is so
      // generic (document).
      self.documentMouseup = null;

      // "Pseudo" focus includes any interaction with the plugin, even if the
      // input has blurred.
      self.focusPseudo = false;

      // "Real" focus is strictly when the input has focus.
      self.focusReal = false;

      // Whether a mousedown event is triggered on a list item.
      self.mousedown = false;

      // The currently selected data.
      self.selectedData = null;

      // Whether the last selection was by mouseup.
      self.selectedMouseup = false;

      // The request buffer timer in case the timer needs to be aborted due to
      // another key press.
      self.timer = null;

      // The current input value for comparison.
      self.value = self.$input.val();

      // Bind the necessary events.
      self
        ._bindInput()
        ._bindList()
        ._bindDocument();

      self
        ._initSelected()
        ._initOptions();
    },

    // Set an option.
    _setOption: function (option, value) {
      // Required call to the parent where the new option value is saved.
      $.Widget.prototype._setOption.apply(this, arguments);

      this._initOptions(option, value);
    },

    // Initialize options that require a little extra work.
    _initOptions: function (option, value) {
      var self = this,
          allOptions = option === undefined,
          options = {};

      // If no option is specified, initialize all options.
      if (allOptions) {
        options = self.options;
      }
      // Otherwise, initialize only the specified option.
      else {
        options[option] = value;
      }

      $.each(options, function (option, value) {
        switch (option) {
          case 'label':
            // Ensure that the 'label' is a jQuery object if a selector string
            // or plain DOM element is passed.
            self.options.label = $(value).addClass('mp_label');

            // Ensure that the label has an ID for ARIA support.
            if (self.options.label.attr('id')) {
              self.removeLabelId = false;
            }
            else {
              self.removeLabelId = true;

              self.options.label.attr('id', self.inputName + '_label');
            }

            self._toggleLabel();

            self.$input.attr('aria-labelledby', self.options.label.attr('id'));

            break;

          case 'required':
            self.$input.attr('aria-required', value);

            break;

          case 'selected':
            // During initial creation (when all options are initialized), only
            // initialize the 'selected' value if there is one. The
            // '_initSelected' method parses the input's attributes for a
            // selected value.
            if (allOptions && value) {
              self.select(value, null, true);
            }

            break;

          case 'url':
            // If no 'url' option is specified, use the parent form's 'action'.
            if (!value) {
              self.options.url = self.$input.closest('form').attr('action');
            }

            break;
        }
      });

      return self;
    },

    // Programmatically change the input value without triggering a search
    // request (use the 'search' method for that). If the value is different
    // than the current input value, the 'onChange' callback is fired.
    change: function (q, onlyValue) {
      var self = this;

      // Change the input value if a new value is specified.
      if (q === self.value) {
        return;
      }

      self.$input.val(q);

      // Reset the currently selected data.
      self.selectedData = null;

      // Keep track of the new input value for later comparison.
      self.value = q;

      self._trigger('change', [q]);

      if (onlyValue !== true) {
        if (self.focusPseudo) {
          // Clear out the existing results to prevent future stale results
          // in case the change is made while the input has focus.
          self
            ._cancelPendingRequest()
            ._hideAndEmptyList();
        }
        else {
          // Show or hide the label depending on if the input has a value.
          self._toggleLabel();
        }
      }
    },

    // Programmatically trigger a search request using the existing input value
    // or a new one.
    search: function (q) {
      var $input = this.$input;

      // Change the input value if a new value is specified. Otherwise, use the
      // existing input value.
      if (q !== undefined) {
        $input.val(q);
      }

      // Focus on the input to start the request and enable keyboard
      // navigation (only available when the input has focus).
      $input.focus();
    },

    // Select an item from the results list.
    select: function (data, $item, initial) {
      var self = this,
          $input = self.$input,
          hideOnSelect = self.options.hideOnSelect;

      if (hideOnSelect) {
        self._hideList();
      }

      // If there's no data, consider this a call to deselect (or reset) the
      // current value.
      if (!data) {
        return self.change('');
      }

      // Save the selected data for later reference.
      self.selectedData = data;

      self._trigger('select', [data, $item, !!initial]);

      // It's common to update the input value with the selected item during
      // 'onSelect', so check if that has occurred and store the new value.
      if ($input.val() !== self.value) {
        self.value = $input.val();

        // Check if the label needs to be toggled when this method is called
        // programmatically (usually meaning the input doesn't have focus).
        if (!self.focusPseudo) {
          self._toggleLabel();
        }

        // Hide and empty the existing results to prevent future stale results.
        self._hideAndEmptyList();
      }
    },

    // Initialize the input with a selected value from the 'data-selected'
    // attribute (JSON) or standard 'value' attribute (string).
    _initSelected: function () {
      var self = this,
          $input = self.$input,
          data = $input.data('selected'),
          value = $input.val();

      if (data) {
        self.select(data, null, true);
      }
      else if (value) {
        self.select(value, null, true);
      }

      return self;
    },

    // Get the currently selected data.
    selected: function () {
      return this.selectedData;
    },

    // Remove the autocomplete functionality and return the selected input
    // fields to their original state.
    destroy: function () {
      var self = this,
          options = self.options,
          $input = self.$input;

      // Remove the results list element.
      self.$list.remove();

      // Reset the input to its original attribute values.
      $.each(self.inputOriginals, function (attribute, value) {
        if (value === undefined) {
          $input.removeAttr(attribute);
        }
        else {
          $input.attr(attribute, value);
        }
      });

      $input.removeClass('mp_input');

      // Reset the label to its original state.
      if (options.label) {
        options.label.removeClass('mp_label');

        if (self.removeLabelId) {
          options.label.removeAttr('id');
        }
      }

      // Remove the specific document 'mouseup' event for this instance.
      $(document).unbind('mouseup.marcoPolo', self.documentMouseup);

      // Parent destroy removes the input's data and events.
      $.Widget.prototype.destroy.apply(self, arguments);
    },

    // Get the results list element.
    list: function () {
      return this.$list;
    },

    // Bind the necessary events to the input.
    _bindInput: function () {
      var self = this,
          $input = self.$input,
          $list = self.$list;

      $input
        .bind('focus.marcoPolo', function () {
          // Do nothing if the input already has focus. This prevents
          // additional 'focus' events from initiating the same request.
          if (self.focusReal) {
            return;
          }

          // It's overly complicated to check if an input field has focus, so
          // "manually" keep track in the 'focus' and 'blur' events.
          self.focusPseudo = true;
          self.focusReal = true;

          self._toggleLabel();

          // If this focus is the result of a mouse selection (which re-focuses
          // on the input), ignore as if a blur never occurred.
          if (self.selectedMouseup) {
            self.selectedMouseup = false;
          }
          // For everything else, initiate a request.
          else {
            self._trigger('focus');

            self._request($input.val());
          }
        })
        .bind('keydown.marcoPolo', function (key) {
          var $highlighted = $();

          switch (key.which) {
            // Highlight the previous item.
            case self.keys.UP:
              // The default moves the cursor to the beginning or end of the
              // input value. Keep it in its current place.
              key.preventDefault();

              // Show the list if it has been hidden by ESC.
              self
                ._showList()
                ._highlightPrev();

              break;

            // Highlight the next item.
            case self.keys.DOWN:
              // The default moves the cursor to the beginning or end of the
              // input value. Keep it in its current place.
              key.preventDefault();

              // Show the list if it has been hidden by ESC.
              self
                ._showList()
                ._highlightNext();

              break;

            // Highlight the first item.
            case self.keys.HOME:
              // The default scrolls the page to the top.
              key.preventDefault();

              // Show the list if it has been hidden by ESC.
              self
                ._showList()
                ._highlightFirst();

              break;

            // Highlight the last item.
            case self.keys.END:
              // The default scrolls the page to the bottom.
              key.preventDefault();

              // Show the list if it has been hidden by ESC.
              self
                ._showList()
                ._highlightLast();

              break;

            // Select the currently highlighted item. Input keeps focus.
            case self.keys.ENTER:
              // Prevent selection if the list isn't visible.
              if (!$list.is(':visible')) {
                // Prevent the form from submitting.
                if (!self.options.submitOnEnter) {
                  key.preventDefault();
                }

                return;
              }

              $highlighted = self._highlighted();

              if ($highlighted.length) {
                self.select($highlighted.data('marcoPolo'), $highlighted);
              }

              // Prevent the form from submitting if 'submitOnEnter' is
              // disabled or if there's a highlighted item.
              if (!self.options.submitOnEnter || $highlighted.length) {
                key.preventDefault();
              }

              break;

            // Select the currently highlighted item. Input loses focus.
            case self.keys.TAB:
              // Prevent selection if the list isn't visible.
              if (!$list.is(':visible')) {
                return;
              }

              $highlighted = self._highlighted();

              if ($highlighted.length) {
                self.select($highlighted.data('marcoPolo'), $highlighted);
              }

              break;

            // Hide the list.
            case self.keys.ESC:
              self
                ._cancelPendingRequest()
                ._hideList();

              break;
          }
        })
        .bind('keyup.marcoPolo', function () {
          // Check if the input value has changed. This prevents keys like CTRL
          // and SHIFT from firing a new request.
          if ($input.val() !== self.value) {
            self._request($input.val());
          }
        })
        .bind('blur.marcoPolo', function () {
          self.focusReal = false;

          // When an item in the results list is clicked, the input blur event
          // fires before the click event, causing the results list to become
          // hidden (code below). This 1ms timeout ensures that the click event
          // code fires before that happens.
          setTimeout(function () {
            // If the $list 'mousedown' event has fired without a 'mouseup'
            // event, wait for that before dismissing everything.
            if (!self.mousedown) {
              self._dismiss();
            }
          }, 1);
        });

      return self;
    },

    // Bind the necessary events to the list.
    _bindList: function () {
      var self = this;

      self.$list
        .bind('mousedown.marcoPolo', function () {
          // Tracked for use in the input 'blur' event.
          self.mousedown = true;
        })
        .delegate('li.mp_selectable', 'mouseover', function () {
          self._addHighlight($(this));
        })
        .delegate('li.mp_selectable', 'mouseout', function () {
          self._removeHighlight($(this));
        })
        .delegate('li.mp_selectable', 'mouseup', function () {
          var $item = $(this);

          self.select($item.data('marcoPolo'), $item);

          // This event is tracked so that when 'focus' is called on the input
          // (below), a new request isn't fired.
          self.selectedMouseup = true;

          // Give focus back to the input for easy tabbing on to the next
          // field.
          self.$input.focus();
        });

      return self;
    },

    // Bind the necessary events to the document.
    _bindDocument: function () {
      var self = this;

      // A reference to this function is maintained for unbinding in the
      // 'destroy' method. This is necessary because the selector is so
      // generic (document).
      $(document).bind('mouseup.marcoPolo', self.documentMouseup = function () {
        // Tracked for use in the input 'blur' event.
        self.mousedown = false;

        // Ensure that everything is dismissed if anything other than the input
        // is clicked. (A click on a selectable list item is handled above,
        // before this code fires.)
        if (!self.focusReal && self.$list.is(':visible')) {
          self._dismiss();
        }
      });

      return self;
    },

    // Show or hide the label (if one exists) depending on whether the input
    // has focus or a value.
    _toggleLabel: function () {
      var self = this,
          $label = self.options.label;

      if ($label && $label.length) {
        if (self.focusPseudo || self.$input.val()) {
          $label.hide();
        }
        else {
          $label.show();
        }
      }

      return self;
    },

    // Get the first selectable item in the results list.
    _firstSelectableItem: function () {
      return this.$list.children('li.mp_selectable:visible:first');
    },

    // Get the last selectable item in the results list.
    _lastSelectableItem: function () {
      return this.$list.children('li.mp_selectable:visible:last');
    },

    // Get the currently highlighted item in the results list.
    _highlighted: function () {
      return this.$list.children('li.mp_highlighted');
    },

    // Remove the highlight class from the specified item.
    _removeHighlight: function ($item) {
      $item
        .removeClass('mp_highlighted')
        .attr('aria-selected', 'false')
        .removeAttr('id');

      this.$input.removeAttr('aria-activedescendant');

      return this;
    },

    // Add the highlight class to the specified item.
    _addHighlight: function ($item) {
      // The current highlight is removed to ensure that only one item is
      // highlighted at a time.
      this._removeHighlight(this._highlighted());

      $item
        .addClass('mp_highlighted')
        .attr({
          'aria-selected': 'true',
          'id': this.inputName + '_highlighted'
        });

      this.$input.attr('aria-activedescendant', $item.attr('id'));

      return this;
    },

    // Highlight the first selectable item in the results list.
    _highlightFirst: function () {
      this._addHighlight(this._firstSelectableItem());

      return this;
    },

    // Highlight the last selectable item in the results list.
    _highlightLast: function () {
      this._addHighlight(this._lastSelectableItem());

      return this;
    },

    // Highlight the item before the currently highlighted item.
    _highlightPrev: function () {
      var $highlighted = this._highlighted(),
          $prev = $highlighted.prevAll('li.mp_selectable:visible:first');

      // If there is no "previous" selectable item, continue at the list's end.
      if (!$prev.length) {
        $prev = this._lastSelectableItem();
      }

      this._addHighlight($prev);

      return this;
    },

    // Highlight the item after the currently highlighted item.
    _highlightNext: function () {
      var $highlighted = this._highlighted(),
          $next = $highlighted.nextAll('li.mp_selectable:visible:first');

      // If there is no "next" selectable item, continue at the list's
      // beginning.
      if (!$next.length) {
        $next = this._firstSelectableItem();
      }

      this._addHighlight($next);

      return this;
    },

    // Show the results list.
    _showList: function () {
      // But only if there are results to be shown.
      if (this.$list.children().length) {
        this.$list.show();

        this.$input.attr('aria-expanded', 'true');
      }

      return this;
    },

    // Hide the results list.
    _hideList: function () {
      this.$list.hide();

      this.$input
        .removeAttr('aria-activedescendant')
        .removeAttr('aria-expanded');

      return this;
    },

    // Empty the results list.
    _emptyList: function () {
      this.$list.empty();

      this.$input.removeAttr('aria-activedescendant');

      return this;
    },

    // Hide and empty the results list.
    _hideAndEmptyList: function () {
      this.$list
        .hide()
        .empty();

      this.$input
        .removeAttr('aria-activedescendant')
        .removeAttr('aria-expanded');

      return this;
    },

    // Build the results list from a successful request that returned no data.
    _buildNoResultsList: function (q) {
      var self = this,
          $input = self.$input,
          $list = self.$list,
          options = self.options,
          $item = $('<li class="mp_no_results" role="alert" />'),
          formatNoResults;

      // Fire 'formatNoResults' callback.
      formatNoResults = options.formatNoResults && options.formatNoResults.call($input, q, $item);

      if (formatNoResults) {
        $item.html(formatNoResults);
      }

      self._trigger('noResults', [q, $item]);

      // Displaying a "no results" message is optional. It isn't displayed if
      // the 'formatNoResults' callback returns a false value.
      if (formatNoResults) {
        $item.appendTo($list);

        self._showList();
      }
      else {
        self._hideList();
      }

      return self;
    },

    // Build the results list from a successful request that returned data.
    _buildResultsList: function (q, data) {
      var self = this,
          $input = self.$input,
          $list = self.$list,
          options = self.options,
          // The currently selected data for use in comparison.
          selected = self.selectedData,
          // Whether to compare the currently selected item with the results. A
          // 'compare' setting key has to be specified, and there must be a
          // currently selected item.
          compare = options.compare && selected,
          compareCurrent,
          compareSelected,
          compareMatch = false,
          datum,
          $item = $(),
          formatItem;

      // Loop through each result and add it to the list.
      for (var i = 0, length = data.length; i < length; i++) {
        datum = data[i];
        $item = $('<li class="mp_item" />');
        formatItem = options.formatItem.call($input, datum, $item);

        // Store the original data for easy access later.
        $item.data('marcoPolo', datum);

        $item
          .html(formatItem)
          .appendTo($list);

        if (compare && options.highlight) {
          // If the 'compare' setting is set to boolean 'true', assume the data
          // is a string and compare directly.
          if (options.compare === true) {
            compareCurrent = datum;
            compareSelected = selected;
          }
          // Otherwise, assume the data is an object and the 'compare' setting
          // is the attribute name to compare on.
          else {
            compareCurrent = datum[options.compare];
            compareSelected = selected[options.compare];
          }

          // Highlight this item if it matches the selected item.
          if (compareCurrent === compareSelected) {
            self._addHighlight($item);

            // Stop comparing the remaining results, as a match has been made.
            compare = false;
            compareMatch = true;
          }
        }
      }

      // Mark all selectable items, based on the 'selectable' selector setting.
      $list
        .children(options.selectable)
        .addClass('mp_selectable')
        .attr({
          'aria-selected': 'false',
          'role': 'option'
        });

      self._trigger('results', [data]);

      self._showList();

      // Highlight the first item in the results list if the currently selected
      // item was not found and already highlighted, and the option to auto-
      // highlight is enabled.
      if (!compareMatch && options.highlight) {
        self._highlightFirst();
      }

      return self;
    },

    // Build the results list from a successful request.
    _buildSuccessList: function (q, data) {
      var self = this,
          $input = self.$input,
          options = self.options;

      self._emptyList();

      // Fire 'formatData' callback.
      if (options.formatData) {
        data = options.formatData.call($input, data);
      }

      if ($.isEmptyObject(data)) {
        self._buildNoResultsList(q);
      }
      else {
        self._buildResultsList(q, data);
      }

      return self;
    },

    // Build the results list with an error message.
    _buildErrorList: function (jqXHR, textStatus, errorThrown) {
      var self = this,
          $input = self.$input,
          $list = self.$list,
          options = self.options,
          $item = $('<li class="mp_error" role="alert" />'),
          formatError;

      self._emptyList();

      // Fire 'formatError' callback.
      formatError = options.formatError && options.formatError.call($input, $item, jqXHR, textStatus, errorThrown);

      if (formatError) {
        $item.html(formatError);
      }

      self._trigger('error', [$item, jqXHR, textStatus, errorThrown]);

      // Displaying an error message is optional. It isn't displayed if the
      // 'formatError' callback returns a false value.
      if (formatError) {
        $item.appendTo($list);

        self._showList();
      }
      else {
        self._hideList();
      }

      return self;
    },

    // Build the results list with a message when the minimum number of
    // characters hasn't been entered.
    _buildMinCharsList: function (q) {
      var self = this,
          $input = self.$input,
          $list = self.$list,
          options = self.options,
          $item = $('<li class="mp_min_chars" role="alert" />'),
          formatMinChars;

      // Don't display the minimum characters list when there are no
      // characters.
      if (!q.length) {
        self._hideAndEmptyList();

        return self;
      }

      self._emptyList();

      // Fire 'formatMinChars' callback.
      formatMinChars = options.formatMinChars && options.formatMinChars.call($input, options.minChars, $item);

      if (formatMinChars) {
        $item.html(formatMinChars);
      }

      self._trigger('minChars', [options.minChars, $item]);

      // Displaying a minimum characters message is optional. It isn't
      // displayed if the 'formatMinChars' callback returns a false value.
      if (formatMinChars) {
        $item.appendTo($list);

        self._showList();
      }
      else {
        self._hideList();
      }

      return self;
    },

    // Cancel any pending ajax request and input key buffer.
    _cancelPendingRequest: function () {
      var self = this;

      // Abort the ajax request if still in progress.
      if (self.ajax) {
        self.ajaxAborted = true;
        self.ajax.abort();
      }
      else {
        self.ajaxAborted = false;
      }

      // Clear the request buffer.
      clearTimeout(self.timer);

      return self;
    },

    // Make a request for the specified query and build the results list.
    _request: function (q) {
      var self = this,
          $input = self.$input,
          $list = self.$list,
          options = self.options;

      self._cancelPendingRequest();

      // Check if the input value has changed.
      self.change(q, true);

      // Requests are buffered the number of ms specified by the 'delay'
      // setting. This helps prevent an ajax request for every keystroke.
      self.timer = setTimeout(function () {
        var param = {},
            params = {},
            cacheKey,
            $inputParent = $();

        // Display the minimum characters message if not reached.
        if (q.length < options.minChars) {
          self._buildMinCharsList(q);

          return self;
        }

        // Add the query to the additional data to be sent with the request.
        param[options.param] = q;

        params = $.extend({}, options.data, param);

        // Build the request URL with query string data to use as the cache
        // key.
        cacheKey = options.url + (options.url.indexOf('?') === -1 ? '?' : '&') + $.param(params);

        // Check for and use cached results if enabled.
        if (options.cache && cache[cacheKey]) {
          self._buildSuccessList(q, cache[cacheKey]);
        }
        // Otherwise, make an ajax request for the data.
        else {
          self._trigger('requestBefore');

          // Add a class to the input's parent that can be hooked-into by the
          // CSS to show a busy indicator.
          $inputParent = $input.parent().addClass('mp_busy');
          $list.attr('aria-busy', 'true');

          // The ajax request is stored in case it needs to be aborted.
          self.ajax = $.ajax({
            url: options.url,
            dataType: 'json',
            data: params,
            success:
              function (data) {
                self._buildSuccessList(q, data);

                // Cache the data.
                if (options.cache) {
                  cache[cacheKey] = data;
                }
              },
            error:
              function (jqXHR, textStatus, errorThrown) {
                // Show the error message unless the ajax request was aborted
                // by this plugin. 'ajaxAborted' is used because 'errorThrown'
                // does not faithfull return "aborted" as the cause.
                if (!self.ajaxAborted) {
                  self._buildErrorList(jqXHR, textStatus, errorThrown);
                }
              },
            complete:
              function (jqXHR, textStatus) {
                // Reset ajax reference now that it's complete.
                self.ajax = null;
                self.ajaxAborted = false;

                // Remove the "busy" indicator class on the input's parent.
                $inputParent.removeClass('mp_busy');
                $list.attr('aria-busy', 'false');

                self._trigger('requestAfter', [jqXHR, textStatus]);
              }
          });
        }
      }, options.delay);

      return self;
    },

    // Dismiss the results list and cancel any pending activity.
    _dismiss: function () {
      var self = this,
          options = self.options;

      self.focusPseudo = false;

      self
        ._cancelPendingRequest()
        ._hideAndEmptyList();

      // Empty the input value if the 'required' setting is enabled and nothing
      // is selected.
      if (options.required && !self.selectedData) {
        self.change('', true);
      }

      self
        ._toggleLabel()
        ._trigger('blur');

      return self;
    },

    // Trigger a callback subscribed to via an option or using .bind().
    _trigger: function (name, args) {
      var self = this,
          callbackName = 'on' + name.charAt(0).toUpperCase() + name.slice(1),
          triggerName = self.widgetEventPrefix.toLowerCase() + name.toLowerCase(),
          triggerArgs = $.isArray(args) ? args : [],
          callback = self.options[callbackName];

      self.element.trigger(triggerName, triggerArgs);

      return callback && callback.apply(self.element, triggerArgs);
    }
  });
}));

/*!
 * Manifest v1.3.5
 *
 * A jQuery plugin that adds delight to selecting multiple values for an input.
 *
 * https://github.com/jstayton/jquery-manifest
 *
 * Copyright 2013 by Justin Stayton
 * Licensed MIT
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
