const inputs = document.querySelectorAll('.input');

function changeToFocus() {
    let parent = this.parentNode.parentNode;
    parent.classList.add('focus');
}

function changeToBlur() {
    let parent = this.parentNode.parentNode;
    if (this.value == "") {
        parent.classList.remove('focus');
    }
}

for (let input of inputs) {
    input.addEventListener('focus', changeToFocus);
    input.addEventListener('blur', changeToBlur);
}

document.querySelector('.close').addEventListener('click', function() {
    document.querySelector('.blur-background').style.display = 'none';
})