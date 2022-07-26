/**
 WebConsole Manager for WebConsole
 Used to manage active connections
 https://github.com/mesacarlos
 2019-2020 Carlos Mesa under MIT License.
*/
class WebConsoleManager {
	constructor() {
		this.activeConnections = []; //Active Connectors list
	}

	/**
	* Loads a existing connection or creates a new one
	*/
	loadConnection(URI) {
		this.activeConnection = new WebConsoleConnector("smp", URI);
		this.activeConnection.connect();
	}

	/**
	* Send password to server
	*/
	sendPassword(pwd) {
		this.activeConnection.sendToServer({
			command: "LOGIN",
			params: pwd
		});
	}

	/**
	* Send console command to server
	*/
	sendConsoleCmd(cmd) {
		this.activeConnection.sendToServer({
			command: "EXEC",
			token: this.activeConnection.token,
			params: cmd
		});

		this.activeConnection.commands.push(cmd);
	}

	/**
	* Asks server for CPU, RAM and players info
	*/
	askForInfo() {
		this.activeConnection.sendToServer({
			command: "PLAYERS",
			token: this.activeConnection.token,
		});

		this.activeConnection.sendToServer({
			command: "CPUUSAGE",
			token: this.activeConnection.token,
		});

		this.activeConnection.sendToServer({
			command: "RAMUSAGE",
			token: this.activeConnection.token,
		});

		this.activeConnection.sendToServer({
			command: "TPS",
			token: this.activeConnection.token,
		});
	}

	/**
	* Asks server for full latest.log
	*/
	askForLogs() {
		this.activeConnection.sendToServer({
			command: "READLOGFILE",
			token: this.activeConnection.token,
		});
	}

}