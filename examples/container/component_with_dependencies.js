
import { Container } from './../../src/bunny.container';

import { ColorProvider } from './color_provider';

Container.bind('color', ColorProvider);

export var ComponentWithDependencies = {

    getColor: function() {
        return Container.get('color').color;
    }

};
