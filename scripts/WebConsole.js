/**
 Main JS file for WebConsole.
 https://github.com/mesacarlos
 2019-2020 Carlos Mesa under MIT License.
*/

/**
 * Global variables
 */
const connectionManager = new WebConsoleManager();
let lang;
let autoPasswordCompleted = false; //When true, saved password was used. If a 401 is received, then saved password is not correct
let statusCommandsInterval = -1;
let commandHistoryIndex = -1; //Saves current command history index. -1 when not browsing history.
let params = new URLSearchParams(window.location.search);

/**
* Prepare and show server to user
*/
function openServer(serverName) {
	$("#serverContainer").show();

	//Change server name and related info
	$("#serverTitle").text(serverName);
	$("#consoleTextArea").text("");
	$("#commandInput").prop("disabled", false);
	$("#sendCommandButton").prop("disabled", false);

	//New server, new variables:
	autoPasswordCompleted = false;
	commandHistoryIndex = -1; //Reset command history index

	//Create or retrieve connection
	connectionManager.loadConnection(serverName);

	//Load saved messages
	let i;
	const messages = connectionManager.activeConnection.messages;
	for (i = 0; i < messages.length; i++) {
		if (messages[i].status !== 401) {
			onWebSocketsMessage(messages[i]);
		}
	}

	//Subscribe a function
	connectionManager.activeConnection.subscribe(onWebSocketsMessage);
}

function onWebSocketsMessage(message) {
	switch (message.status) {
		case 10:
			//Console Output
			writeToWebConsole(message.message, message.time);
			break;
		case 200:
			//LoggedIn
			writeToWebConsole(message.message);

			//Show user and permissions
			$("#loggedUsernameLabel").text(message.username);
			$("#loggedUserTypeLabel").text(message.as);

			//Disable command bar if user is viewer
			if (message.as.toLowerCase() === "viewer") {
				$("#commandInput").prop("disabled", true);
				$("#sendCommandButton").prop("disabled", true);
			}

			//Read log file if enabled
			if (false) {
				if (connectionManager.activeConnection.isLogged === false) {
					connectionManager.activeConnection.isLogged = true;
					connectionManager.askForLogs();
				}
			}
			
			break;
		case 400:
			//Unknown Command
			writeToWebConsole(message.message);
			break;
		case 401:
			if (autoPasswordCompleted) break;
			autoPasswordCompleted = true;
			connectionManager.sendPassword(params.get("p"));
			break;
		default:
			console.log('Unknown server response:');
	}
}

/**
* Write to console
*/
function writeToWebConsole(msg, time) {
	const isScrolledDown = document.getElementById("consoleTextArea").scrollHeight - document.getElementById("consoleTextArea").scrollTop - 40 === $("#consoleTextArea").height();

	//Write to div, replacing < to &lt; (to avoid XSS) and replacing new line to br.
	msg = msg.replace(/</g, "&lt;");
	msg = msg.replace(/(?:\r\n|\r|\n)/g, "<br>");

	//Color filter for Windows (thanks to SuperPykkon)
	msg = msg.replace(/\[0;30;22m/g, "<span style='color: #000000;'>"); //&0
	msg = msg.replace(/\[0;34;22m/g, "<span style='color: #0000AA;'>"); //&1
	msg = msg.replace(/\[0;32;22m/g, "<span style='color: #00AA00;'>"); //&2
	msg = msg.replace(/\[0;36;22m/g, "<span style='color: #00AAAA;'>"); //&3
	msg = msg.replace(/\[0;31;22m/g, "<span style='color: #AA0000;'>"); //&4
	msg = msg.replace(/\[0;35;22m/g, "<span style='color: #AA00AA;'>"); //&5
	msg = msg.replace(/\[0;33;22m/g, "<span style='color: #FFAA00;'>"); //&6
	msg = msg.replace(/\[0;37;22m/g, "<span style='color: #AAAAAA;'>"); //&7
	msg = msg.replace(/\[0;30;1m/g, "<span style='color: #555555;'>");  //&8
	msg = msg.replace(/\[0;34;1m/g, "<span style='color: #5555FF;'>");  //&9
	msg = msg.replace(/\[0;32;1m/g, "<span style='color: #55FF55;'>");  //&a
	msg = msg.replace(/\[0;36;1m/g, "<span style='color: #55FFFF;'>");  //&b
	msg = msg.replace(/\[0;31;1m/g, "<span style='color: #FF5555;'>");  //&c
	msg = msg.replace(/\[0;35;1m/g, "<span style='color: #FF55FF;'>");  //&d
	msg = msg.replace(/\[0;33;1m/g, "<span style='color: #FFFF55;'>");  //&e
	msg = msg.replace(/\[0;37;1m/g, "<span style='color: #FFFFFF;'>");  //&f
	msg = msg.replace(/\[m/g, "</span>");  //&f

	//Color filter for UNIX (This is easier!)
	//span may not be closed every time but browsers will do for ourselves
	msg = msg.replace(/§0/g, "<span style='color: #000000;'>"); //&0
	msg = msg.replace(/§1/g, "<span style='color: #0000AA;'>"); //&1
	msg = msg.replace(/§2/g, "<span style='color: #00AA00;'>"); //&2
	msg = msg.replace(/§3/g, "<span style='color: #00AAAA;'>"); //&3
	msg = msg.replace(/§4/g, "<span style='color: #AA0000;'>"); //&4
	msg = msg.replace(/§5/g, "<span style='color: #AA00AA;'>"); //&5
	msg = msg.replace(/§6/g, "<span style='color: #FFAA00;'>"); //&6
	msg = msg.replace(/§7/g, "<span style='color: #AAAAAA;'>"); //&7
	msg = msg.replace(/§8/g, "<span style='color: #555555;'>"); //&8
	msg = msg.replace(/§9/g, "<span style='color: #5555FF;'>"); //&9
	msg = msg.replace(/§a/g, "<span style='color: #55FF55;'>"); //&a
	msg = msg.replace(/§b/g, "<span style='color: #55FFFF;'>"); //&b
	msg = msg.replace(/§c/g, "<span style='color: #FF5555;'>"); //&c
	msg = msg.replace(/§d/g, "<span style='color: #FF55FF;'>"); //&d
	msg = msg.replace(/§e/g, "<span style='color: #FFFF55;'>"); //&e
	msg = msg.replace(/§f/g, "<span style='color: #FFFFFF;'>"); //&f

	msg = msg.replace(/§l/g, "<span style='font-weight:bold;'>"); //&l
	msg = msg.replace(/§m/g, "<span style='text-decoration: line-through;'>"); //&m
	msg = msg.replace(/§n/g, "<span style='text-decoration: underline;'>"); //&n
	msg = msg.replace(/§o/g, "<span style='font-style: italic;'>"); //&o

	msg = msg.replace(/§r/g, "</span>");  //&r

	//Append datetime if enabled
	if (true) {
		if (typeof time !== 'undefined' && time !== null) //if time is present and not null
			msg = "<span style='color: #2b97fc'>[" + time + "]</span> " + msg;
		else if (typeof time !== 'undefined' && time === null) //if time is present and null
			; //no time (is already printed)
		else
			msg = "<span style='color: #2b97fc'>[" + new Date().toLocaleTimeString() + "]</span> " + msg;
	}


	$("#consoleTextArea").append(msg + "<br>");

	if (isScrolledDown) {
		const textarea = document.getElementById('consoleTextArea');
		textarea.scrollTop = textarea.scrollHeight;
	}
}

/**
* Called from WebConsoleConnector only.
*/
function closedConnection(serverName) {
	//Disable command input and button
	$("#commandInput").prop("disabled", true);
	$("#sendCommandButton").prop("disabled", true);

	//Inform user
	$('#disconnectionModal').modal('show');
}

openServer(params.get("h"));
