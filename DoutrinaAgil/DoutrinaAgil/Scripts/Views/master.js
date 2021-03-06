﻿$(document).ready(function () {
    //show toastr message when redirected
    showQueryMessage();

    //get doctrines total
    getTotalCount();

    //focus main search field
    $("#search-term").focus();

    //set login popup html
    $(function () {
        $("#btn-popover-login").popover({
            html: true,
            content: function () {
                var form = $('<form id="form-login" class="form-login"></form>');

                form.html(`<div class="input-group">
						<span class ="input-group-addon"><i class ="glyphicon glyphicon-user"></i></span>
						<input type="text" class ="form-control" id="email" name="email" placeholder="E-mail">
						</div>
						<span class="help-block"></span>
						<div class="input-group">
						<span class ="input-group-addon"><i class ="glyphicon glyphicon-lock"></i></span>
						<input  type="password" class ="form-control" id="password" name="password" placeholder="Senha">
						</div>
						<span id="login-msg-box" class ="help-block text-center text-error"></span>
                        <div class='form-group'>
						<button class ="btn btn-sm btn-primary btn-block btn-blue popup-login-btn" onclick="popupLogin()"><i class ="fa fa-refresh fa-spin hidden"></i>Login</button></div>`);

                //validations for login popup
                form.validate({
                    rules: {
                        email: {
                            required: true,
                            email: true
                        },
                        password: {
                            required: true
                        }
                    },
                    messages: {
                        email: {
                            required: "Informe seu e-mail",
                            email: "Por favor informe um email válido"
                        },
                        password: {
                            required: "Informe sua senha"
                        }
                    },
                    errorClass: "error-class",
                    validClass: "valid-class",
                    highlight: function (element) {
                        $(element).closest(".input-group").addClass("has-error");
                    },
                    unhighlight: function (element) {
                        $(element).closest(".input-group").removeClass("has-error");
                    },
                    errorPlacement: function (error, element) {
                        if (element.parent(".input-group").length) {
                            error.insertAfter(element.parent());
                        } else {
                            error.insertAfter(element);
                        }
                    }
                });

                return form;
            }
        });
    });

    //popover events when show and hide
    $("[data-toggle='popover']").on("shown.bs.popover", function () {
        var email = $(".popover").find("#email");
        var password = $(".popover").find("#password");

        email.focus();

        //enter to select next popover field
        email.keypress(function (e) {
            if (e.which === 13) {
                password.focus();
                return false;
            }

            return true;
        });

        //enter to send form on field password
        password.keypress(function (e) {
            if (e.which === 13) {
                popupLogin();
                return false;
            }

            return true;
        });
    });

    $("[data-toggle='popover']").on("hidden.bs.popover", function () {
        $("#search-term").focus();
    });

    //buttons events
    $("#btnSave").click(function (e) {
        e.preventDefault();

        var form = $("#form-create-user");

        if (!form.valid())
            return;

        Request.post({
            url: "/Auth/RegisterUser",
            data: $("#form-create-user").serialize(),
            ignoreLoading: true,
            buttonLoading: $(this),
            success: function (data) {
                if (data.Response === EResponse.Error) {
                    $("#register-msg-box").text(data.Message);
                    $("#register-msg-box").show();
                    return;
                }

                //redirect to index page to update header
                location.href = "?msg=" + data.Message + "&msgType=success";
            }
        });
    });

    //search events
    $(".search-btn").click(function (e) {
        e.preventDefault();

        $("#quote-btn").addClass("hidden");
        $("#search-term").val($("#search-term").val().trim());
        searchQuery($("#search-term").val());
    });

    function searchQuery(query) {
        $("#response-box-container").addClass("hidden");

        if (query === "") {
            toastr.error("Informe uma Palavra-chave, autor ou título");
            return;
        }

        Request.get({
            url: "/Search/Search",
            data: "query=" + query,
            success: function (data) {
                if (data.Response === EResponse.Error) {
                    toastr.error(data.Message);
                    return;
                }

                showSearchResult(data);
            },
            error: function (data) {
                console.log("Erro ao executar requisição ao servidor.");
                console.log(data.Message);
            }
        });
    }

    function showSearchResult(data) {
        var divResult = $("#response-box-container");
        var query = $("#search-term").val();

        //remove old results
        divResult.html("");

        //show the result container
        divResult.removeClass("hidden");

        if (data === "") {
            divResult.append("<h2>Resultados da pesquisa por <span>" + query + "</span></h2><span><span id='result-total'>0</span> Resultados encontrados</span>");
            return;
        }

        var json = JSON.parse(data);

        if (json.length <= 0) {
            divResult.append("<h2>Resultados da pesquisa por <span>" + query + "</span></h2><span><span id='result-total'>0</span> Resultados encontrados</span>");
            return;
        }

        //append new results
        $.each(json, function (key, result) {
            //books and doctrines informations
            var author = result.Book.author;
            var title = result.Book.title;
            var publisher = result.Book.editora;
            var year = result.Book.anoPub;
            var local = result.Book.localPub;
            var total = json[key].Contents.length;

            //alter bg-main css to fit the height
            $(".bg-main").css("height", "auto");

            divResult.append("<h2>Resultados da pesquisa por <span>" + query + "</span></h2><span><span id='result-total'>" + total + "</span> Resultados encontrados</span>");

            $.each(json[key].Contents, function (key, content) {
                var regex = /(<([^>]+)>)/ig; //remove all html from preview to not break accordion styles
                var preview = content.texto.replace(regex, "").substr(0, 400) + "..."; //limit the preview text
                divResult.append("<div class='result-item' data-publisher='" + publisher + "' data-year='" + year + "' data-local='" + local + "'><span class='result-title'>" + title + "</span><span class='result-author'><i>Autor</i>" + author + "</span><span class='result-page'><i>Página</i>" + content.page + "</span><span class='result-text'><h3>" + preview + "<h3><div><p onclick='copyToClipboard(event)'>" + content.texto + "</p></div></span></div>");
            });

            //highlight result texts
            //$(".result-text").html(resultHighlight($(".result-text").html(), query));
        });

        $(".result-text").accordion({
            active: false,
            collapsible: true,
            activate: function (event, ui) {
                if (!ui.newHeader.length)
                    return;

                var top = $(ui.newHeader).offset().top;

                $("html,body").animate({
                    scrollTop: top - 100
                }, 1500);
            }
        });
    }

    //highlight query words in result
    function resultHighlight(text, term) {
        var terms = term.split(" ");

        $.each(terms, function (key, term) {
            if (term.length >= 3) {
                term = term.replace(/(\s+)/, "(<[^>]+>)*$1(<[^>]+>)*");
                var pattern = new RegExp("(" + term + ")", "gi");

                text = text.replace(pattern, "<mark>$1</mark>");
            }
        });

        return text;
        //remove the mark tag if needed
        //srcstr = srcstr.replace(/(<mark>[^<>]*)((<[^>]+>)+)([^<>]*<\/mark>)/, "$1</mark>$2<mark>$4");
    }

    //enter to send search
    $("#search-term").keypress(function (e) {
        if (e.which === 13) {
            $("#search-btn").click();
            return false;
        }

        return true;
    });

    $("#quote-btn").click(function (e) {
        e.preventDefault();

        var book = window.getSelection().getRangeAt(0).startContainer.parentNode.closest(".result-item");
        var author = abtnFunc.name($(book).children(".result-author").ignore("i").text());
        var title = $(book).children(".result-title").text();
        var page = $(book).children(".result-page").ignore("i").text();
        var local = $(book).data("local");
        var publisher = $(book).data("publisher");
        var year = $(book).data("year");
        var cbFooter = author + " " + title + ". " + local + ": " + publisher + ", " + year + ", Pg. " + page + ".";
        var cbText = window.getSelection().toString();
        var $temp = $("<textarea>").appendTo("body").val("\"" + cbText + "\"\r\n" + cbFooter).select();

        $("#quote-btn").addClass("hidden");
        document.execCommand("copy");
        $temp.remove();

        //message copyed to clipboard to user
        toastr.success("Citação copiada com sucesso");
    });

    $('[data-toggle="tooltip"]').tooltip();

    //event that scrolls page to top
    $("#btn-scroll-top").click(function () {
        $("html,body").animate({
            scrollTop: 0
        }, "fast");
    });

    //event to close login popup when register modal opens
    $("#createModal").on("shown.bs.modal", function () {
        $("[data-toggle='popover']").each(function () {
            var pop = $(this);

            if (pop.is(":visible"))
                pop.popover("hide");
        });
    });

});//end document.ready event

function getTotalCount() {
    Request.get({
        url: "/Home/GetTotalDoctrines",
        ignoreLoading: true,
        success: function (data) {
            if (data.Response === EResponse.Error) {
                toastr.error(data.Message);
                return;
            }

            var result = JSON.parse(data);
            $("#total-doctrines").html(result.doutrinas);
        }
    });
}

//login function
function popupLogin() {
    var form = $("#form-login");

    if (!form.valid())
        return;

    Request.post({
        url: "/Auth/Login",
        data: form.serialize(),
        ignoreLoading: true,
        buttonLoading: $(".popup-login-btn")[0],
        success: function (data) {
            if (data.Response === EResponse.Error) {
                $("#login-msg-box").text(data.Message);
                return;
            }

            //redirect to index page to update header
            location.href = "?msg=" + data.Message + "&msgType=success";
        }
    });
}

//validation register form
$("#form-create-user").validate({
    rules: {
        name: {
            required: true
        },
        email: {
            required: true,
            email: true
        },
        password: {
            required: true
        },
        confirmpassword: {
            required: true
        }
    },
    messages: {
        name: {
            required: "Informe seu nome"
        },
        email: {
            required: "Informe seu e-mail",
            email: "Por favor informe um email válido"
        },
        password: {
            required: "Informe sua senha"
        },
        confirmpassword: {
            required: "Confirme sua senha"
        }
    },
    errorClass: "error-class",
    validClass: "valid-class",
    highlight: function (element) {
        $(element).closest(".form-group").addClass("has-error").addClass("fix-modal-error-msg");
    },
    unhighlight: function (element) {
        $(element).closest(".form-group").removeClass("has-error").removeClass("fix-modal-error-msg");
    },
    errorPlacement: function (error, element) {
        if (element.parent(".form-group").length) {
            error.insertAfter(element.parent());
        } else {
            error.insertAfter(element);
        }
    }
});

//show message after login with toastr
function showQueryMessage() {
    var msg = getUrlParameter("msg");
    var msgType = getUrlParameter("msgType");

    if (msg === "")
        return;

    if (msgType === "success")
        toastr.success(msg);

    if (msgType === "error")
        toastr.error(msg);

    //change url to remove query string
    window.history.pushState("", "Doutrina Ágil - A doutrina que importa para você", "/");
}

//get parameter from query string
function getUrlParameter(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
    var results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
};

//mouse events
function copyToClipboard(event) {
    var text = window.getSelection().toString();

    if (text === "") {
        $("#quote-btn").addClass("hidden");
    } else {
        var quoteBtn = $("#quote-btn");
        quoteBtn.css({ position: "absolute", top: event.pageY, left: event.pageX });
        quoteBtn.removeClass("hidden");
    }
};

//repositioning popover when window changes size
$(window).off("resize").on("resize", function () {
    $("[data-toggle='popover']").each(function () {
        var popover = $(this);
        if (popover.is(":visible")) {
            var ctrl = $(popover.context);
            ctrl.popover("show");
        }
    });
});