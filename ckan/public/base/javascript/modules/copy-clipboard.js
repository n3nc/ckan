this.ckan.module('copy-clipboard', function() {


    return {
		options : {
			id: ''
		},
		initialize: function () {
            let color = null;
			this.el[0].addEventListener("click", () => {
                var textArea = document.createElement("textarea");
                textArea.value = this.options.id;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand("Copy");
                textArea.remove();
                // document.body.removeChild(textArea);
            });
			this.el[0].addEventListener("mousedown", () => {
                color=this.el[0].firstChild.style.color;
                this.el[0].firstChild.style.color="blue";
            });
			this.el[0].addEventListener("mouseup", () => {
                this.el[0].firstChild.style.color=color;
            });
        }
    }
});