// an object for queueing up actions to happen when some other thing finishes

function DeferredViewAction (query) {
    this.queue = [];
    this.working = true;
    var self = this;
    db.view(query, { success: function(data) {
        self.results = data;
        for (var i in self.queue) {
            var action = self.queue[i]
            action(data);
        }
        self.queue = [];
        self.working = false;
    }});
}

DeferredViewAction.prototype.enqueue = function(action) {
    if(this.working) {
        this.queue.push(action);
    } else {
        action(this.results);
    }
}

DeferredViewAction.prototype.isDone = function(action) {
    return this.working;
}

