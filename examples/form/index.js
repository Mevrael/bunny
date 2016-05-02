
import { Form } from '../../src/form/form';

Form.initAll();
Form.mirrorAll('form1');
//Form.calcMirrorAll('form2');

document.forms[0].addEventListener('submit', (e) => {
    e.preventDefault();

    Form.setFileFromUrl(document.forms[0].id, 'photo', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/400px-Google_2015_logo.svg.png').then((blob) => {
        Form.submit(document.forms[0].id).then((responseData) => {
            console.log(responseData);
        }).catch((response) => {
            console.log(response);
        });
    });


});

