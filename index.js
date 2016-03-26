/*jshint esversion: 6 */

(function(){
	'use strict';

	module.exports = (pluginContext) => {

		//This controls the number of decimal places in the output answer
		const NUMBER_OF_DECIMAL_PLACES = 2;

		const toast = pluginContext.toast;
		const logger = pluginContext.logger;
		const app = pluginContext.app;

		const http = require("http");
		//const clipboard = pluginContext.app.clipboard;

		const currencies = [
			"AUD",
		    "BGN",
		    "BRL",
		    "CAD",
		    "CHF",
		    "CNY",
		    "CZK",
		    "DKK",
		    "EUR",
		    "GBP",
		    "HKD",
		    "HRK",
		    "HUF",
		    "IDR",
		    "ILS",
		    "INR",
		    "JPY",
		    "KRW",
		    "MXN",
		    "MYR",
		    "NOK",
		    "NZD",
		    "PHP",
		    "PLN",
		    "RON",
		    "RUB",
		    "SEK",
		    "SGD",
		    "THB",
		    "TRY",
		    "USD",
		    "ZAR"
		];

		function search(query, res) {
			const query_trim = query.trim();
			var query_split = query_trim.split(" ");

			if (query_trim.length === 0) {
	      		return;
	    	}

	    	const is_valid_amt = !(isNaN(query_split[0]));
	    	
	    	if(!is_valid_amt){
	    		res.add({
	    			id: 'invalid',
	    			payload: '',
	    			title: query_trim,
	    			desc: 'Cannot convert ' + query_split[0]
	    		});
	    		return;
	    	}

	    	if (query_split.length < 3){
	    		res.add({
	    			id: 'invalid',
	    			payload: '',
	    			title: query_trim,
	    			desc: 'Converting...'
	    		});
	    		return;
	    	}

	    	if (query_split.length > 3 ){
	    		res.add({
	    			id: 'invalid',
	    			payload: '',
	    			title: query_trim,
	    			desc: 'Too many arguments!'
	    		});
	    		return;
	    	}

	    	query_split[0] = parseFloat(query_split[0]);

	    	query_split[1] = query_split[1].toUpperCase();
	    	const is_valid_curr_from = currencies.includes(query_split[1]);

	    	query_split[2] = query_split[2].toUpperCase();
	    	const is_valid_curr_to = currencies.includes(query_split[2]);
	    	
	    	if(!is_valid_curr_from){
				res.add({
					id: 'invalid',
					payload: '',
					title: query_trim,
					desc: query_split[1] + ' is not a supported currency.'
				});
				return;
			}

			if(!is_valid_curr_to) {
				res.add({
					id: 'invalid',
					payload: '',
					title: query_trim,
					desc: query_split[2] + ' is not a supported currency.'
				});
				return;
			}

			if(is_valid_amt && is_valid_curr_to && is_valid_curr_from){
				res.add({
					id: 'working',
					payload: query_split,
					title: query_trim,
					desc: 'Converting ' + query_split[0] + " " + query_split[1] + ' to ' + query_split[2] + "..."
				});
				
				getRate(query_split, function(payload) {
					res.remove('working');
					const final_amt = payload[0] * payload[3];
					payload.push(final_amt);
					/*
					At this point, for payload:
					0 - original number
					1 - currency from
					2 - currency to
					3 - rate of convertion
					4 - final value
					*/
					res.add({
						id: 'done',
						payload: payload,
						title: '' + payload[0] + ' ' + payload[1] + ' = ' + final_amt + ' ' + payload[2],
						desc: 'Type Enter to copy \'' + final_amt + '\' to clipboard'
					});
				});
			} else {
				res.add({
	    			id: 'invalid',
	    			payload: '',
	    			title: query_trim,
	    			desc: 'Converting...'
	    		});
	    		return;
			}
		}

		function getRate(payload, callback){

			http.get({
				"method": "GET",
				"hostname": "api.fixer.io",
				"path": "/latest?base=" + payload[1] +"&symbols=" + payload[2]
			}, function(response) {
				var body = '';
				response.on('data', function(d) {
            		body += d;
       			});
				response.on('end', function() {
					const parsedBody = JSON.parse(body);
					const rate = parsedBody.rates[payload[2]];
					const rate_2dp = (Number(rate)).toFixed(NUMBER_OF_DECIMAL_PLACES);
					payload.push(rate_2dp);
					callback(payload);
				});
			}).on('error', (e) => {
				logger.log(`Got error: ${e.message}`);
			});
		}

		function execute(id, payload){
			if (id === 'invalid'){
				return;
			}

			//clipboard.writeText(final_amt);
			//toast.enqueue(final_amt + " has been copied to the clipboard");
			toast.enqueue("This doesn't actually work yet, sorry!");
			//app.close();
		}

		return { search, execute };
	};
})();