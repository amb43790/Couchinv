
function build_customer_activity() {
    var activity = $("#activity");
    activity.empty();

    activity.append('<h1>Customers</h1>'
                    + '<div id="customers">'
                    + '<div><a href="#" class="add">Add Customer</a>'
			+ '<span class="search"><form action=""><input type"text" id="searchquery"/>'
                        + '<input type="submit" value="Search" id="submitsearch">'
                        + '<input type="submit" value="Reset" id="resetsearch"></form></span></div>'
                    + '<div id="customerlist"/><div id="customerdetail"/>'
                    + '</div>');
    $("a.add").bind('click', function(event) {
        customerform();
        return false;
    });

    initial_customer_list();
}

function initial_customer_list() {
    db.view("couchinv/customers-byname", {
        success: function(data) {
	    update_customer_list(data.rows);
        }
    });
}


function update_customer_list(rows) {
    var customerlist = $("#customerlist");
    customerlist.empty();
    var customerdetail = $("#customerdetail");
    customerdetail.empty();

    var listhtml = '<ul class="itemlist"><lh class="itemrow"><span>Name</span><span>Email</span></lh>';
    for (i in rows) {
	var row = rows[i].value;
	var customerid = row._id;
	listhtml = listhtml + '<li id="' + customerid + '" class="itemrow">'
		    + '<span class="name">' + row.lastname + ', ' + row.firstname + '</span>'
		    + '<span class="email">' + row.email + '</span>'
		    + '<span class="editremove"><a href="#" id="' + customerid + '" class="edit">Edit</a>   '
		    + '<a href="#" id="' + customerid + '" class="remove">Remove</a></span></li>';
    }
    listhtml = listhtml + '</ul>';
    customerlist.append(listhtml);
    $(".itemlist .itemrow").click( function(event) {
	var target = $(event.target);
	if (! target.is('li')) {
            // if the target was one of the spans, 
	    target = target.parents('li');
	}
	var docid = target.attr('id');
        if (! docid) {
            // They clicked on the header
            return false;
        }
	db.openDoc(docid, { success: function(doc) {
	    $(".itemrow").removeClass('selected');
	    target.addClass('selected');
	    var detailhtml = '<ul class="itemdetail">';
	    for (var key in doc) {
		if (key.substr(0,1) != '_') {  // skip _id _rev and such
		    detailhtml = detailhtml + '<li><span>' + key + '</span><span>'
				    + doc[key] + '</span></li>';
		}
	    }
            customerdetail.empty();
            customerdetail.append(detailhtml);
        }});
        return false;
    });
}
    


function customerform(doctoedit) {
    var formhtml = '<h1>' + (doctoedit ? 'Edit' : 'Add') + ' Customer</h1>';
    formhtml = formhtml + '<form name="updatecustomer" id="updatecustomer" action="">';

    if (doctoedit) {
	// Editing an existing customer
	formhtml = formhtml 
                   + '<input name="docid" id="docid" type="hidden" value="' + doctoedit._id + '"/>';
    }

    formhtml = formhtml + '<table>'
	+ '<tr><td>First name</td>'
	+ '<td><input name="firstname" type="text" id="firstname" value="'
	    + (doctoedit ? doctoedit.firstname : '')
	    + '"/></td></tr>'

	+ '<tr><td>Last name</td>'
	+ '<td><input name="lastname" type="text" id="lastname" value="'
	    + (doctoedit ? doctoedit.lastname : '')
	    + '"/></td></tr>'

	+ '<tr><td>Address</td>'
	+ '<td><textarea name="address" id="address" rows="4" cols="40">'
	    + (doctoedit ? doctoedit.address : '')
	    + '</textarea></td></tr>'
	
	+ '<tr><td>Phone number</td>'
	+ '<td><input name="phonenumber" type="text" id="phonenumber" value="'
	    + (doctoedit ? doctoedit.phonenumber : '')
	    + '"/></td></tr>'


	+ '<tr><td>Email</td>'
	+ '<td><input name="email" type="text" id="email" value="'
	    + (doctoedit ? doctoedit.email : '')
	    + '"/></td></tr>'

	+ '<tr><td>Notes</td>'
	+ '<td><textarea name="notes" id="notes" rows="4" cols="40">'
	    + (doctoedit ? doctoedit.notes : '')
	    + '</textarea></td></tr>'
	+ '</table><input type="submit" name="submit" class="update" value="'
	+ (doctoedit ? 'Update' : 'Add') + '"/>'
	+ '<input type="submit" name="submit" class="cancel" value="Cancel"/></form>';

    var dialog = popup_dialog(formhtml);
    var form = dialog.children("form#updatecustomer");
    form.children("input.update").click( function(event) {
	db.saveDoc(build_customer_doc_from_form(doctoedit, form),
		{ success: function() {
			popup_cleanup(dialog);
			initial_customer_list();
	    }});
	return false;
    });

    form.children('input.cancel').click( function(event) {
	popup_cleanup(dialog);
	return false;
    });
}

function build_customer_doc_from_form(doc,form) {
    if (!doc) {
	doc = new Object;
    }
    doc.firstname   = form.find("input#firstname").val();
    doc.lastname    = form.find("input#lastname").val();
    doc.address	    = form.find("input#address").val();
    doc.phonenumber = form.find("input#phonenumber").val();
    doc.email	    = form.find("input#email").val();
    doc.notes	    = form.find("input#notes").val();
    doc.type	    = 'customer';

    return doc;
}
