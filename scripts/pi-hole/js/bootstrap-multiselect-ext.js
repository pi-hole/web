/*
 * Extension to bootstrap-multiselect jQuery plugin
 *
 */

(function($) {
  var helperFunctions = {
    extRemoveVisibleDropdowns: function() {
      $('body > ul.dropdown-menu').remove();
    }
  }
  var extMethods = {
    /*
     * Sets dropdown as direct child of body (to make it appear topmost),
     * aligns it, and makes it visible
     */
    extShowDropdown: function() {
      if (!this.$ul.parent().is('body')) {
        $('body').append(this.$ul);
      }
      this.extAlignDropdown();
      this.$ul.show();
    },
    /*
     * Hides and moves dropdown to it's container
     */
    extHideDropdown: function() {
      this.$ul.hide();
      if (!this.$ul.parent().is(this.$container)) {
        this.$container.append(this.$ul);
      }
    },
    /*
     * Aligns dropdown to the multiselect button
     */
    extAlignDropdown: function() {
      var contRect = this.$container[0].getBoundingClientRect();
      var contOffset = this.$container.offset();

      // Set vertical shift
      var bottom = $(window).height() - contRect.top;
      var listHeight = this.$ul.height();
      var vertShift = -listHeight;

      if (bottom < listHeight + contRect.height) {
        this.$container.addClass("dropup");
      } else {
        this.$container.removeClass("dropup");
        vertShift = contRect.height;
      }

      // Set horizontal shift
      var windowWidth = $(window).width();
      var rightWidth = windowWidth - contOffset.left;
      var listWidth = this.$ul.width();

      if (windowWidth - 26 < contRect.right) {
        // Button's right end is out of view, align dropdown
        // to the table's right border
        this.$ul.css("left", (windowWidth - listWidth - 26) + "px");
      } else if (rightWidth < listWidth) {
        // Dropdown's right end is out of view, align
        // right end to button's right end
        this.$ul.css("left", (contOffset.left - listWidth + contRect.width) + "px");
      } else {
        // Align dropdown's left end to the left end of the button
        this.$ul.css("left", contOffset.left + "px");
      }

      this.$ul.css("position", "absolute");
      this.$ul.css("top", (contOffset.top + vertShift) + "px");
    }
  }

  $.extend(true, $.fn.multiselect, helperFunctions);
  $.extend(true, $.fn.multiselect.Constructor.prototype, extMethods);
})(jQuery);
