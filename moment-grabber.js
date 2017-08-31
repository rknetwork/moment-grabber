//! momentGrabber
//! version : 0.1.7
//! authors : Alex Galiyev
//! license : MIT
//! https://github.com/rknetwork/moment-grabber

;(function($, window, document, undefined) {

	"use strict";

	var MomentGrabber = MomentGrabber,
		defaults = {
			timeScrollStepping: 5,
			minYear: 2010,
			maxYear: 2050,
			minMoment: false,
			position: false,
			showTime: true,
			view: 'days',
			autoClose: false
		};

	function MomentGrabber(element, options) {
		this.element = $(element);
		this.options = $.extend({}, defaults, options);
		this._defaults = defaults;
		this.init();
	}

	$.extend(MomentGrabber.prototype, {
		init: function() {
			var _this = this; // Access element inside handlers

			this.element.on('click', function(event) {

				// Remove any visible grabbers
				$('.momentgrabber:visible').remove();

				// Convert input to moment and store it

				if ($(this).val() !== '') {
					var mg = moment($(this).val(), 'L LT', false);
					$(_this.element).data('mg', mg);
				} else if (_this.options.minMoment) {
					var mg = moment(_this.options.minMoment).add(_this.options.timeScrollStepping, 'm');
				} else {
					var mg = moment();
				}

				$(_this.element).data('mg', mg);

				// Generate calendar
				var calendar = generateCalendar(mg, _this.options);

				// Set time and highlight day
				$(calendar)
					.find('.mg-day[data-day='+mg.format("MD")+']').addClass('mg-selected-hl').end()
					.find('.mg-hours-text').text(mg.format('h')).end()
					.find('.mg-minutes-text').text(mg.format('mm')).end()
					.find('.mg-ampm a').text(mg.format('a')).addClass('mg-' + mg.format('a'));

				var position = $(this).offset();
				var width = $(this).outerWidth();
				var windowWidth = $(window).outerWidth();
				var height = $(this).outerHeight();

				// Insert calendar and set position
				$(calendar)	.find('.mg-time').toggle(_this.options.showTime).end()
						.appendTo('body')
						.css({ 'top': position.top + height + 1, 'left': position.left });

				// Re-adjust position
				if (_this.options.position)
					$(calendar).css({ 'margin-top': _this.options.position.top, 'margin-left': _this.options.position.left });

				// Handle outside clicking
				$('html').click(function(outsideEvent) {
					if ($(outsideEvent.target).closest('.momentgrabber').length == 0) {
						$('.momentgrabber').remove();
					}
				}); event.stopPropagation();

				// Month arrows click handler
				$(calendar).on('click', '.mg-left-arrow, .mg-right-arrow', function() {
					var type = $(this).attr('class').split(' ')[0].replace('mg-', ''); // Get first class ONLY!
					var month = $(calendar).find('.mg-calendar-month').val();
					var year = $(calendar).find('.mg-calendar-year').val();

					var mg = moment($(_this.element).data('mg')).year(year).month(month); // Set to currently displayed month

					if (type == 'left-arrow') mg.subtract(1, 'month');
					if (type == 'right-arrow') mg.add(1, 'month');

					// Generate new days
					var newCalendar = generateCalendar(mg, _this.options);
					var newTbody = $(newCalendar).find('tbody');

					$(calendar)
						.find('.mg-calendar-month').val(mg.month()).end()
						.find('.mg-calendar-year').val(mg.format('YYYY')).end()
						.find('table tbody').replaceWith( $(newTbody) );
				});

				// Month and Year dropdowns change handler
				$(calendar).on('change', '.mg-calendar-month, .mg-calendar-year', function() {
					var type = $(this).attr('class').split(' ')[0].replace('mg-', ''); // Get first class ONLY!
					var month = $(calendar).find('.mg-calendar-month').val();
					var year = $(calendar).find('.mg-calendar-year').val();
					var mg = moment($(_this.element).data('mg')).year(year).month(month); // Set to currently displayed month
					var value = $(this).val();

					if (type == 'calendar-month') mg.month(value);
					if (type == 'calendar-year') mg.year(value);

					// Generate new days
					var newCalendar = generateCalendar(mg, _this.options);
					var newTbody = $(newCalendar).find('tbody');

					$(calendar)
						.find('.mg-calendar-month').val(mg.month()).end()
						.find('.mg-calendar-year').val(mg.format('YYYY')).end()
						.find('table tbody').replaceWith( $(newTbody) );
				});

				// Day click
				$(calendar).on('click', '.mg-day:not(.mg-disabled)', function() {
					var LorLT = _this.options.showTime ? 'L LT' : 'L';

					var isPrevMonth = $(this).hasClass('mg-prev');
					var isNextMonth = $(this).hasClass('mg-next');

					var prevMg = moment($(_this.element).data('mg'));

					var year = $(calendar).find('.mg-calendar-year').val();
					var month = $(calendar).find('.mg-calendar-month').val();
					var day = $(this).text();
					var mg = $(_this.element).data('mg') ? $(_this.element).data('mg') : moment();
					mg.year(year).month(month);

					if (isPrevMonth) mg.subtract(1, 'month');
					if (isNextMonth) mg.add(1, 'month');

					mg.date(day);

					$(_this.element).data('mg', mg);

					$(_this.element).val(mg.format(LorLT));

					$(calendar)
						.find('.mg-selected-hl').removeClass('mg-selected-hl').end();

					$(this).addClass('mg-selected-hl');

					$(_this.element).trigger('mgUserChange', [mg, prevMg]);

					if (_this.options.autoClose)
						$('.momentgrabber').remove();
				});

				// Day click
				$(calendar).on('click', '.mg-month:not(.mg-disabled)', function() {
					var prevMg = moment($(_this.element).data('mg'));

					var year = $(calendar).find('.mg-calendar-year').val();
					var month = $(this).data('month');
					var mg = $(_this.element).data('mg') ? $(_this.element).data('mg') : moment();
					mg.year(year).month(month);

					mg.month(month);

					$(_this.element).data('mg', mg);

					$(_this.element).val(mg.format('L LT'));

					$(calendar)
						.find('.mg-selected-hl').removeClass('mg-selected-hl').end();

					$(this).addClass('mg-selected-hl');

					$(_this.element).trigger('mgUserChange', [mg, prevMg]);

					if (_this.options.autoClose)
						$('.momentgrabber').remove();
				});

				// Time arrows and am/pm click handler 
				$(calendar).on('click', '.mg-hours-up, .mg-hours-down, .mg-minutes-up, .mg-minutes-down, .mg-ampm-change', function() {
					var type = $(this).attr('class').split(' ')[0].replace('mg-', ''); // Get first class ONLY!
					var mg = $(_this.element).data('mg') ? $(_this.element).data('mg') : moment();
					var prevMg = moment($(_this.element).data('mg'));

					if (type == 'hours-up') mg.add(1, 'hours');
					if (type == 'hours-down') mg.subtract(1, 'hours');
					if (type == 'minutes-up') mg.add(_this.options.timeScrollStepping, 'minutes');
					if (type == 'minutes-down') mg.subtract(_this.options.timeScrollStepping, 'minutes');
					if (type == 'ampm-change') {
						var ampm = $(this).text() == 'pm' ? 'am' : 'pm';
						var newMg = $(_this.element).val().replace(/am|pm/i, ampm);
						var mg = moment(newMg, 'L LT', false);
					}

					// Don't update time if less than (minMoment + timeScrollStepping)
					if (_this.options.minMoment && mg.isSameOrBefore(_this.options.minMoment)) {
						$(_this.element).data('mg', prevMg);
						return;
					}

					$(_this.element).data('mg', mg);
					$(_this.element).val(mg.format('L LT'));

					$(calendar)
						.find('.mg-selected-hl').removeClass('mg-selected-hl').end()
						.find('.mg-day[data-day='+mg.format('MD')+']').addClass('mg-selected-hl').end()
						.find('.mg-hours-text').text(mg.format('h')).end()
						.find('.mg-minutes-text').text(mg.format('mm')).end()
						.find('.mg-ampm a').text(mg.format('a')).removeClass('mg-am mg-pm').addClass('mg-' + mg.format('a'));

					$(_this.element).trigger('mgUserChange', [mg, prevMg]);
				});

			});

//			this.element.on('focus', function(event) {
//				var mg = moment($(this).val(), 'L LT', false);
//				var ts = $(this).data('ts', mg.format('X')); // Store timestamp for possible revertion (see blur)
//			});

			this.element.on('change', function(event) {
				var mg = moment($(this).val(), 'L LT', false);
				var prevMg = moment($(this).data('mg'));

				// Revert to previous value if mg is less than (minMoment + timeScrollStepping)
				if (_this.options.minMoment && mg.isSameOrBefore(_this.options.minMoment)) {
					$(this).val(prevMg.format('L LT')); // Revert to previously saved moment
					return;
				}

				if (mg.isValid()) {
					$(this).val(mg.format('L LT'));
				} else {
					$(this).val(moment().format('L LT'));
				}

				$(_this.element).data('mg', mg);
				$(_this.element).trigger('mgUserChange', [mg, prevMg]);
			});
		},
		update: function(mg) {
			if (mg == null) {
				this.element.val('');
				this.element.removeData('mg');
			} else if (mg == false) {
				// For convenience =)
			} else {
				var LorLT = this.options.showTime ? 'L LT' : 'L';
				this.element.val(mg.format(LorLT));
				this.element.data('mg', mg);
			}
		},
		setMinMoment: function(mg) {
			this.options.minMoment = mg;
		},
		setPosition: function(position) {
			this.options.position = position;
		},
	});

	function generateCalendar(mg, options) {

		// Prepare calendar's normal view html
		var calendar = $(
		"<div class='momentgrabber mg-days-view mg-unselectable'>" + 
		  "<div class='mg-calendar'>" + 
			"<div class='mg-calendar-controls mg-flex-between'>" + 
			  "<button class='mg-left-arrow'>&larr;</button>" +
			  "<select class='mg-calendar-month'></select>" +
			  "<select class='mg-calendar-year'></select>" +
			  "<button class='mg-right-arrow'>&rarr;</button>" +
			"</div>" + 
			"<table>" +
			  "<thead><tr class='mg-weekdays'></tr></thead>" +
			  "<tbody></tbody>" +
			"</table>" +
		  "</div>" + 
		  "<div class='mg-time mg-flex-around'>" + 
			"<div class='mg-hours'><a class='mg-hours-up'>&#x25B2;</a><div class='mg-hours-text'>00</div><a class='mg-hours-down'>&#x25BC;</a></div>" + 
			"<div class='mg-minutes'><a class='mg-minutes-up'>&#x25B2;</a><div class='mg-minutes-text'>00</div><a class='mg-minutes-down'>&#x25BC;</a></div>" + 
			"<div class='mg-ampm'><a class='mg-ampm-change'>am</a></div>" + 
		  "</div>" + 
		"</div>");

		// Prepare calendar's months view html
		var calendarMonthsView = $(
		"<div class='momentgrabber mg-months-view mg-unselectable'>" + 
		  "<div class='mg-calendar'>" + 
			"<div class='mg-calendar-controls'>" + 
			  "<select class='mg-calendar-year'></select>" +
			"</div>" + 
			"<table>" +
			  "<tbody></tbody>" +
			"</table>" +
		  "</div>" + 
		"</div>");

		if (options.view == 'days') {

			// Create moments
			var startOfMonth = moment(mg).date(1); // same as startOf('month'), but preserves time
			var endOfMonth = moment(mg).date(1).add(1, 'month').subtract(1, 'ms'); // same as .endOf('month'), but preserves time
			var startOfCalendar = startOfMonth.format('ddd') !== moment(startOfMonth).weekday(0).format('ddd') ? moment(startOfMonth).weekday(0) : startOfMonth;
			var endOfCalendar = endOfMonth.format('ddd') !== moment(endOfMonth).weekday(0).add(1, 'week').subtract(1, 'ms').format('ddd') ? moment(endOfMonth).weekday(0).add(1, 'week').subtract(1, 'ms') : endOfMonth;

			// Generate months and years
			var months = moment.monthsShort();
			$.each(months, function(i) {
				$(calendar).find('.mg-calendar-month').append( $("<option></option>").val(i).text(this) );
			});

			for(var y=options.minYear; y<=options.maxYear; y++) {
				$(calendar).find('.mg-calendar-year').append( $("<option></option>").val(y).text(y) );
			};

			// Set month and year
			$(calendar)
				.find('.mg-calendar-month').val(startOfMonth.month()).end()
				.find('.mg-calendar-year').val(startOfMonth.format('YYYY'));

			// Generate week days
			var weekDays = moment.weekdaysMin();
			$.each(weekDays, function() {
				$(calendar).find('.mg-weekdays').append( $("<th></th>").text(this) );
			});

			// Fill out day cells and highlight selected and today's
			var weekDay = 0;
			var lastRow;

			for (var m = moment(startOfCalendar); m.isBefore(endOfCalendar); m.add(1, 'days')) {
				if (weekDay == 0 || weekDay == 7) {
					lastRow = $("<tr></tr>");
					$(calendar).find('tbody').append(lastRow);
					weekDay = 0;
				}

				$(lastRow).append( $('<td></td>')
					.data('day', m.format('MD')).attr('data-day', m.format('MD')) // attr needed for search
					.text(m.format('D'))
					.addClass('mg-day')
					.addClass(m.isBefore(startOfMonth) ? 'mg-prev mg-grayedout' : false) // prev month
					.addClass(m.isAfter(endOfMonth) ? 'mg-next mg-grayedout' : false) // next month
					.addClass(options.minMoment && m.isBefore(options.minMoment) ? 'mg-disabled mg-grayedout' : false)
				);

				weekDay++;
			}

			return calendar;

		} else if (options.view == 'months') {

			// Create moments
			var startOfCalendar = moment(mg).startOf('year');
			var endOfCalendar = moment(mg).endOf('year');

			// Generate years
			for(var y=options.minYear; y<=options.maxYear; y++) {
				$(calendarMonthsView).find('.mg-calendar-year').append( $("<option></option>").val(y).text(y) );
			};

			// Set year
			$(calendarMonthsView).find('.mg-calendar-year').val(mg.format('YYYY'));

			// Fill out day cells and highlight selected and today's
			var rowCnt = 0;
			var lastRow;

			for (var m = moment(startOfCalendar); m.isBefore(endOfCalendar); m.add(1, 'month')) {
				if (rowCnt == 0 || rowCnt == 3) {
					lastRow = $("<tr></tr>");
					$(calendarMonthsView).find('tbody').append(lastRow);
					rowCnt = 0;
				}

				$(lastRow).append( $('<td></td>')
					.data('month', m.month()).attr('data-month', m.month()) // attr needed for search
					.text(m.format('MMMM'))
					.addClass('mg-month')
					.addClass(options.minMoment && m.isBefore(options.minMoment) ? 'mg-disabled mg-grayedout' : false)
				);

				rowCnt++;
			}

			return calendarMonthsView;
		}
	}

	$.fn.momentgrabber = function(options) {
		var args = Array.prototype.slice.call(arguments, 1);
		return this.each(function() {
			var element = $(this), instance = element.data('MomentGrabber');
			if (!instance) {
				element.data('MomentGrabber', new MomentGrabber(this, options));
			} else if (typeof options === 'string') {
				instance[options].apply(instance, args);
			}
		});
	}

})(jQuery, window, document);