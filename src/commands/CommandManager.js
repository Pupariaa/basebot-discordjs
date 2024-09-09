const fs = require('fs');
const path = require('path');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const { Collection } = require('discord.js');
require('puparia.getlines.js');
const filePath = path.resolve(__dirname, 'CommandManager.js');


class CommandHandler {
    constructor() {
        console.info(`START: Initializing CommandHandler.`);
        this.commandsPath = path.join(__dirname, 'handlers');
        this.rest = new REST({ version: '10' }).setToken(process.env.discord_cqd_token);
    }

    /**
     * Loads commands from the 'handlers' directory and registers them with the client.
     */
    loadCommands() {
        try {
            console.info(`START: Loading commands`);

            // Initialize client.commands if it doesn't exist
            if (!global.client.commands) {
                global.client.commands = new Collection();
                console.success(`START: Initialized client.commands collection`);
            }

            // Read command files from the handlers directory
            const commandFiles = fs.readdirSync(this.commandsPath).filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                try {
                    const command = require(path.join(this.commandsPath, file));
                    if ('data' in command && 'execute' in command) {
                        global.client.commands.set(command.data.name, command);
                        console.success(`START: Command loaded: ${command.data.name}`);
                    } else {
                        console.warn(`START: The command at ${file} is missing a required "data" or "execute" property.`);
                    }
                } catch (error) {
                    console.error(`START: Error loading command from file ${file}:`, error);
                }
            }

        } catch (error) {
            console.error(`START: Error loading commands:`, error);
        }
    }

    /**
     * Deploys the commands to the Discord application for a specific guild.
     */
    async deployCommands() {

        const commands = [];

        // Convert commands to a format suitable for Discord API
        for (const cmd of global.client.commands.values()) {
            if (cmd.data.name !== 'test') {
                commands.push(cmd.data.toJSON());
            }
        }

        try {
            console.info(`START: Deploying commands to Discord API.`);
            const data = await this.rest.put(
                Routes.applicationGuildCommands(process.env.discord_cqd_cid, process.env.discord_guid),
                { body: commands }
            );
            console.success(`START: ${data.length} commands deployed successfully.`);
        } catch (error) {
            console.error(`START: : Error updating commands:`, error);
        }
    }
}

module.exports = CommandHandler;
