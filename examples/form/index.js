
import '../../src/polyfills/ConstructorName';
import '../../src/polyfills/CustomEvent';
import '../../src/polyfills/Promise';

import Form from '../../src/form/form';
import { BunnyImage } from '../../src/file/image';

Form.initAll();

document.forms.form1.elements.name.addEventListener('change', function() {
    console.log(this);
    console.log(this.value);
});

let gender = document.forms.form1.elements.gender;
console.log(gender);
for (let k = 0 ; k < gender.length; k++) {
    gender[k].addEventListener('change', function () {
        console.log(this);
        console.log(this.value);
    });
}

Form.mirrorAll('form1');
//Form.calcMirrorAll('form2');

const link = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/400px-Google_2015_logo.svg.png';

var image = null;

BunnyImage.getImageByURL(link).then( (img) => {
    image = img;
});

document.forms.form1.addEventListener('submit', (e) => {
    e.preventDefault();
    Form.submit(document.forms[0].id).then((responseData) => {
        console.log('ajax submit ok');
    }).catch((response) => {
        console.log('ajax fail');
    });
});

document.getElementById('set_photo').addEventListener('click', (e) => {
    document.getElementById('form1_submit').setAttribute('disabled', 'disabled');
    Form.setFileFromUrl('form1', 'photo', link).then( (blob) => {
        document.getElementById('form1_submit').removeAttribute('disabled');
        console.log(blob);
    }).catch((e) => {
        console.log(e);
    });
});

let counter = 1;

document.getElementById('add').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.name = 'custom_input';
    input.value = counter++;
    const close = document.createElement('a');
    close.classList.add('btn');
    close.classList.add('btn-danger');
    close.textContent = 'Delete';
    const div = document.createElement('div');
    div.appendChild(input);
    div.appendChild(close);
    close.addEventListener('click', function() {
        document.forms.form1.removeChild(div);
    });
    document.forms.form1.appendChild(div);
});

