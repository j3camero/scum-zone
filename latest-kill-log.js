const browser = require('browser');
const htmlparser = require('htmlparser2');
const moment = require('moment');

function getCsrfToken(html) {
    const csrfBegin = '<input type="hidden" name="_csrfToken" autocomplete="off" value="';
    let csrfIndex = html.indexOf(csrfBegin);
    if (csrfIndex < 0) {
	console.log('Oh noes! No CSRF token found in the login form!');
	return '';
    }
    csrfIndex += csrfBegin.length;
    const endIndex = html.indexOf('"', csrfIndex);
    if (endIndex < 0) {
	console.log('Oh noes! No end quote after CSRF token in login form!');
	return '';
    }
    const csrfToken = html.substring(csrfIndex, endIndex);
    if (csrfToken.length < 100 || csrfToken.length > 200) {
	console.log('CSRF token has the wrong length!');
	return '';
    }
    return csrfToken;
}

var b = new browser();
var loginUrl = ('https://id.g-portal.com/login?redirect=' +
		'https%3A%2F%2Fwww.g-portal.us%2Fen%2F');
console.log('Trying login.');
b.browse('login', loginUrl);
b.browse((err, out) => {
    console.log('Attempted login. Checking for CSRF token.');
    const csrfToken = getCsrfToken(out.result);
    console.log('CSRF token found:');
    console.log(csrfToken);
    console.log('Downloading list of log files...');
    return [loginUrl, {
	data  : {
	    _method: 'POST',
	    _csrfToken: csrfToken,
	    email  : '***REMOVED***',
	    password : '***REMOVED***',
	},
	method: 'POST',
    }];
})
.after('login');  // browse after browsing with label="login"

const logsUrl = 'https://www.g-portal.us/en/scum/logs/71302';
b.browse(logsUrl).after();

b.browse((err, out) => {
    let openOptionTags = 0;
    let optionValue;
    let maxTimestamp;
    let latestKillLogOptionValue;
    console.log('Log list obtained. Finding kill logs...');
    const parser = new htmlparser.Parser({
	onopentag: (name, attribs) => {
	    if (name === 'option') {
		++openOptionTags;
		optionValue = attribs.value;
	    }
	},
	ontext: (text) => {
	    if (openOptionTags === 0) {
		return;
	    }
	    const prefix = 'kill.log (';
	    if (!text || text.length < prefix.length ||
		!text.startsWith(prefix)) {
		return;
	    }
	    const timestampString = text.substring(prefix.length);
	    const t = moment(timestampString, 'DD.MM.YYYY HH:mm:ss)');
	    if (!maxTimestamp || t.isAfter(maxTimestamp)) {
		maxTimestamp = t;
		latestKillLogOptionValue = optionValue;
		console.log('    -> Found ', text, optionValue);
	    }
	},
	onclosetag: (tagname) => {
	    if(tagname === 'option') {
		--openOptionTags;
	    }
	}
    }, {decodeEntities: true});
    parser.write(out.result);
    parser.end();
    console.log('Downloading option ', latestKillLogOptionValue);
    return [logsUrl, {
	data  : {
	    _method: 'POST',
	    'data[ExtConfig][config]': latestKillLogOptionValue,
	    load: '',
	    'data[ExtConfig][currentConfig]': '',
	    'data[ExtConfig][fileContent]': '',
	},
	method: 'POST',
    }];
})
.after();

b.on('end', (err, out) => {
    let openTags = 0;
    console.log('Finding log contents.');
    const parser = new htmlparser.Parser({
	onopentag: (name, attribs) => {
	    if (name === 'textarea') {
		++openTags;
	    }
	},
	ontext: (text) => {
	    if (openTags > 0) {
		console.log('Found log file contents.');
		console.log(text);
	    }
	},
	onclosetag: (tagname) => {
	    if(tagname === 'textarea') {
		--openTags;
	    }
	}
    }, {decodeEntities: true});
    parser.write(out.result);
    parser.end();
});

// Run the whole browser session.
b.run();
