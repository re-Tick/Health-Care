let input = document.querySelector(".fsize");

        input.addEventListener('change', () => {
            let files = input.files;

            if (files.length > 0) {
                if (files[0].size > 400 * 1024) {
                    alert('File Size should not Exceed 400kb');;
                    return;
                }
            }
        });

        var loadFile = function (event) {
            var image = document.getElementById('output');
            image.src = URL.createObjectURL(event.target.files[0]);
        };

        var password = document.getElementById("password"), confirm_password = document.getElementById("confirm_password");
        function validatePassword() {
            if (password.value != confirm_password.value) {
                confirm_password.setCustomValidity("Passwords Don't Match");
            } else {
                confirm_password.setCustomValidity('');
            }
        }
        password.onchange = validatePassword;
        confirm_password.onkeyup = validatePassword;