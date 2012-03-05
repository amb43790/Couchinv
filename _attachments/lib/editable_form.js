//params...
// title: string
// submit: function - called when the submit button is pressed and form validates
// modal: bool - if true, it becomes a popup dialog in the center
// parent: a JQuery element to append this form to
// fields: array
//          {   type: (text, textarea, hidden, select)
//              label: string - text before the input
//              id: string
//              class: string
//              name: string
//              focus: bool - true if this input should get the focus
//              value: string  - default value
//                      for select, value is [[ label, value], [label, value], ...]
//              create: function(input) - called after the input is created
//              validate: function(editable_form, input_id, input)
//                      - return list [flag, reason]
//          }
// buttons: array
//          {   id: string
//              label: string
//              name: string
//              action: 'submit' to validate the inputs and call the 'submit' callback(event)
//                      'remove' to close the form without doing anything else
//                      or a function(event) to call 
//          }



function EditableForm (params) {

    this['title']  = (params['title'] ? params['title'] : 'Form');
    this['submit'] = (params['submit'] ? params['submit'] : function() {} );

    var fields = (params['fields'] ? params['fields'] : [] );
    var buttons = (params['buttons'] ? params['buttons'] : []);

    this.containing_div = $('<div' + (params['modal'] ? ' class="popup_dialog"' : '') + '/>');
    this.form = $('<form ' + (params['id'] ? ('id="' + params['id'] + '"') : '' ) + '/>');
    this.containing_div.append(this.form);

    this.form.append( $('<h1>' + this['title'] + '</h1>') );
    this.table = $('<table class="form"/>');
    this.form.append(this.table);

    this.inputs = {};
    this.validators = {};
    this.tablerows = {};

    var editable_form = this;

    this['fields'] = fields;

    var focus_element;
    for (i in fields) {
        var field = fields[i];

        var rowhtml = '';
        if (field.type != 'hidden') {
            rowhtml += '<tr><td class="prompt">' + field['label'] + '</td><td>';
        }

        if (field.type == 'text') {
            rowhtml += '<input type="text" id="' + field['id'] + '"';
            if (field['class']) {
                rowhtml += ' class="' + field['class'] + '"';
            }
            if (field['name']) {
                rowhtml += ' name="' + field['name'] + '"';
            }
            rowhtml += ' value="' + (field['value'] ? field['value'] : '') + '"/>';

        } else if (field.type == 'textarea') {
            rowhtml += '<textarea id="' + field['id']
                        + '" rows="' + field['rows']
                        + '" cols="' + field['cols'] + '"';
            if (field['class']) {
                rowhtml += ' class="' + field['class'] + '"';
            }
            if (field['name']) {
                rowhtml += ' name="' + field['name'] + '"';
            }
            rowhtml += '>' + (field['value'] ? field['value'] : '') + '</textarea>';

        } else if (field.type == 'hidden') {
            rowhtml += '<input type="hidden" id="' + field['id'] + '"';
            if (field['name']) {
                rowhtml += ' name="' + field['name'] + '"';
            }
            if (field['class']) {
                rowhtml += ' class="' + field['class'] + '"';
            }
            rowhtml += ' value="' + (field['value'] ? field['value'] : '') + '"/>';

        } else if (field.type == 'select') {
            rowhtml += '<select id="' + field['id'] + '"';
            if (field['name']) {
                rowhtml += ' name="' + field['name'] + '"';
            }
            if (field['class']) {
                rowhtml += ' class="' + field['class'] + '"';
            } 
            // value is list of lists [[ label => value ], [ label => value]]
            $.each(field.value, function(idx, val) {
                rowhtml += '<option value="' + val[1]
                            + ((val[1] == field.selected) ? 'selected="selected"' : '')
                            + '">' + val[0] + '</option>';
            });
        }

       if (field.type != 'hidden') {
           rowhtml += '<span class="errortext"/></td></tr>';
        }

        var this_row_elt = $(rowhtml);
        if (field['create']) {
            // create callback
            field['create'](this_row_elt);
        }

        this.table.append(this_row_elt);
        input = this_row_elt.find(field.type == 'select' ? 'select' : 'input');
        if (field['focus'] || !focus_element) {
            focus_element = input;
        }
        this.inputs[field['id']] = input;
        this.validators[field['id']] = field['validate']
                                        ? field['validate']
                                        : function() { return [1] };
        this.tablerows[field['id']] = this_row_elt;
    }

    this.buttons = [];
    for (i in buttons) {
        var button = buttons[i];
        var buttonhtml = '<input type="submit" id="' + button['id']
                            + '" value="' + button['label'] + '"';
        if (button['name']) {
            buttonhtml += ' name="' + button['name'] + '"';
        }
        if (button['class']) {
            buttonhtml += ' class="' + button['class'] + '"';
        }
        buttonhtml += '/>';
        var button_elt = $(buttonhtml);

        this.form.append(button_elt);
        if (button['create']) {
            button['create'](button_elt);
        }

        if (button['action'] == 'submit') {
            var submit_callback = (function (formobj) {
                                    return function (event) {
                                        formobj.validate_inputs_then_submit(event);
                                        return false;
                                    }
                                  })(editable_form);
            button_elt.click(submit_callback);
        } else if (button['action'] == 'remove') {
            remove_callback = (function (formobj) {
                                    return function (event) {
                                        formobj.remove(event);
                                        return false;
                                    }
                                })(editable_form);
            button_elt.click(remove_callback);
        } else {
            button_elt.click(button['action']);
        }
    }

    if (params['modal']) {
        var thediv = this.containing_div;
        $('body').append(thediv);
        // Become a modal dialog in the middle of the screen
        var windowWidth = document.documentElement.clientWidth;
        var windowHeight = document.documentElement.clientHeight;
        var popupHeight = thediv.height();
        var popupWidth = thediv.width();
        // centering
        thediv.css({
               "position": "absolute",
               "top": (windowHeight-popupHeight)/3,
               "left": windowWidth/2-popupWidth/2
             });
        thediv.fadeIn("fast");
        $("#popup_background").fadeIn("fast");

    } else if (params['parent']) {
        params['parent'].append(this.contaning_div);
    }

    focus_element.focus();
}

EditableForm.prototype.markError = function(elt_id, reason) {
    var table_row = this.tablerows[elt_id];
    table_row.addClass('problem');
    table_row.find('.errortext').text(reason);
}

EditableForm.prototype.validate_inputs_then_submit = function(event) {
    // Clear any previous errors
    $('.problem').removeClass('problem');
    $('.errortext').text('');

    var is_valid = 1;
    var editable_form = this;
    $.each(this.validators, function(elt_id, callback) {
        var retval = callback(editable_form, elt_id, editable_form.inputs[elt_id]);
        if (! retval[0]) {
            editable_form.markError(elt_id, retval[1]);
            is_valid = 0;
        }
    });

    if (is_valid && this.submit) {
        this.submit(event);
    }

    return is_valid;
};

EditableForm.prototype.valueFor = function(elt_id) {
    var elt = this.inputs[elt_id];
    if (elt) {
        return elt.val();
    }
    return undefined;
};

EditableForm.prototype.remove = function() {
    $('#popup_background').fadeOut('fast');
    this.containing_div.fadeOut('fast');
    this.containing_div.remove();
}