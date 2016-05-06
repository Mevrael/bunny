
import '../../src/polyfills/ConstructorName';
import '../../src/polyfills/CustomEvent';
import '../../src/polyfills/Promise';

import { Form } from '../../src/form/form';


Form.initAll();
Form.mirrorAll('form1');
//Form.calcMirrorAll('form2');

const link = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/400px-Google_2015_logo.svg.png';

document.forms[0].addEventListener('submit', (e) => {
    e.preventDefault();

    Form.setFileFromUrl('form1', 'photo', link).then( (blob) => {
        Form.submit(document.forms[0].id).then((responseData) => {
            console.log('ok');
        }).catch((response) => {
            console.log('fail');
        });
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
