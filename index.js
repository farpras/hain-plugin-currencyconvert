/*jshint esversion: 6 */

(function(){
	'use strict';

	const ncp = require('copy-paste-win32fix');

	module.exports = (pluginContext) => {

		//This controls the number of decimal places in the output answer
		const NUMBER_OF_DECIMAL_PLACES = 2;

		const toast = pluginContext.toast;
		const logger = pluginContext.logger;
		const app = pluginContext.app;

		const http = require("http");

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
			const query_split = query_trim.split(" ");

			if (query_trim.length === 0) {
	      		return;
	    	}

	    	const is_valid_amt = !(isNaN(query_split[0]));
	    	
	    	if(!is_valid_amt){
	    		return res.add({
	    			id: 'invalid',
	    			payload: 'bad number',
	    			title: query_trim,
	    			desc: 'Cannot convert ' + query_split[0]
	    		});
	    	}

	    	if (query_split.length < 3){
	    		return res.add({
	    			id: 'invalid',
	    			payload: 'too few characters',
	    			title: query_trim,
	    			desc: 'Converting...'
	    		});
	    	}

	    	if (query_split.length > 3 ){
	    		return res.add({
	    			id: 'invalid',
	    			payload: 'too many arguments',
	    			title: query_trim,
	    			desc: 'Too many arguments!'
	    		});
	    	}

	    	var money = new Object();
	    	money.rawNumber = parseFloat(query_split[0]);

	    	money.currencyFrom = query_split[1].toUpperCase();
	    	const is_valid_curr_from = currencies.includes(money.currencyFrom);

	    	money.currencyTo = query_split[2].toUpperCase();
	    	const is_valid_curr_to = currencies.includes(money.currencyTo);
	    	
	    	if(!is_valid_curr_from){
				res.add({
					id: 'invalid',
					payload: '',
					title: query_trim,
					desc: money.currencyFrom + ' is not a supported currency.'
				});
				return;
			}

			if(!is_valid_curr_to) {
				res.add({
					id: 'invalid',
					payload: '',
					title: query_trim,
					desc: money.currencyTo + ' is not a supported currency.'
				});
				return;
			}

			if(is_valid_amt && is_valid_curr_to && is_valid_curr_from){
				res.add({
					id: 'working',
					payload: money,
					title: query_trim,
					desc: 'Converting ' + money.rawNumber + " " + money.currencyFrom + ' to ' + money.currencyTo + "..."
				});
				
				getRate(money, function(money) {
					res.remove('working');
					money.finalAmt = money.rawNumber * money.rate;
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
						payload: money,
						title: '' + money.rawNumber + ' ' + money.currencyFrom + ' = ' + money.finalAmt + ' ' + money.currencyTo,
						desc: 'Type Enter to copy \'' + money.finalAmt + '\' to clipboard'
					});
				});
			} else {
				res.add({
	    			id: 'invalid',
	    			payload: 'something is invalid',
	    			title: query_trim,
	    			desc: 'Converting...'
	    		});
	    		return;
			}
		}

		function getRate(money, callback){

			http.get({
				"method": "GET",
				"hostname": "api.fixer.io",
				"path": "/latest?base=" + money.currencyFrom +"&symbols=" + money.currencyTo
			}, function(response) {
				var body = '';
				response.on('data', function(d) {
            		body += d;
       			});
				response.on('end', function() {
					const parsedBody = JSON.parse(body);
					const rate = parsedBody.rates[money.currencyTo];
					const rate_2dp = (Number(rate)).toFixed(NUMBER_OF_DECIMAL_PLACES);
					money.rate = rate_2dp;
					callback(money);
				});
			}).on('error', (e) => {
				logger.log(`Got error: ${e.message}`);
			});
		}

		function execute(id, payload){
			if (id != 'done'){
				return;
			}

			ncp.copy(payload.finalAmt, () => {
				toast.enqueue("Successfully copied \"" + payload.finalAmt + "\" to the clipboard!");
				app.setQuery("");
			});
		}

		return { search, execute };
	};
})();