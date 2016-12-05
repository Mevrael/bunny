
export const Api = {

    get(url) {
        return fetch(url).then(response => {
            return response.json();
        }).then(data => {
            if (data.message) {
                // May be show custom alert
                console.warn(data.message);
                return [];
            }
            return data;
        })/*.catch(e => {
            console.error(e);
            return Promise.reject(e);
        });*/
    }

};

export const Country = {

    Api: Api,

    search(search) {
        return this.Api.get(`https://restcountries.eu/rest/v1/name/${search}`).then(data => {
            let countries = {};
            data.forEach(country => {
                countries[country.alpha2Code] = country.name;
            });
            return countries;
        })
    }
};

window.Country = Country;
