import { HTTP } from 'meteor/http';


function sendPostRequestToUrl(url, data){
    HTTP.call( 'POST', url, {
        data: data
      }, function( error, response ) {
        if ( error ) {
          console.log( error );
        } else {
          console.log( response );
        }
      });
}
export { sendPostRequestToUrl };