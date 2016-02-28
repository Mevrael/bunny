
import { Autocomplete } from '../../src/bunny.autocomplete';

Autocomplete.create('country', 'country_id', 'https://restcountries.eu/rest/v1/name/{search}', function(response_data) {
    // Result for autocomplete should be an assoc array in format id: value
    // in this example free service is used to search countries and data it provides does not match required format for autocomplete.
    // With Autocomplete.create() 4th argument data_handler response text can be formatted manually.
    // For better performance server should return data in id: value format.
    data = JSON.parse(response_data);
    var result = {};
    data.forEach(function(country) {
        result[country.alpha2Code] = country.name;
    });
    return result;
});
