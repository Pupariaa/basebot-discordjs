'use strict';

const { __cfn, __cf } = eval(require(`current_filename`));
const { report, reportWarn, reportError } = console.createReports(__cfn);

const fs = require('fs');
const path = require('path');
const sanitizeFilename = require('sanitize-filename');
const { downloadFile } = require(global.utilsPath);

class AttachmentsManager {
    filesPath = path.join(global.projectRoot, 'src', 'files');
    indexFilename = 'attachmentsIndex.json';
    constructor(
        indexPath = path.join(global.projectRoot, 'src', 'files', this.indexFilename)
    ) {
        const functionName = 'constructor';
        this.indexPath = indexPath;
        this.downloadsPath = path.join(this.filesPath, 'downloads');
        global.sigintSubscribers.push(this.saveIndex.bind(this));
        if (!fs.existsSync(this.filesPath)) fs.mkdirSync(this.filesPath);
        report(__line, functionName, `${this.indexFilename} path set to:`, indexPath);
    }

    loadIndex() {
        const functionName = 'loadIndex';
        try {
            if (fs.existsSync(this.indexPath)) {
                this.index = JSON.parse(fs.readFileSync(this.indexPath, 'utf8'));
            } else {
                this.index = {};
            }
        } catch (err) {
            reportError(__line, functionName, `Error loading ${this.indexFilename}:`, err);
        }
    }

    saveIndex() {
        const functionName = 'saveIndex';
        try {
            const stringifiedIndex = JSON.stringify(this.index, null, 4);
            if (stringifiedIndex) {
                fs.writeFileSync(this.indexPath, stringifiedIndex, 'utf8');
                report(__line, functionName, `Saved ${this.indexFilename}`);
            }
        } catch (err) {
            reportError(__line, functionName, `Error saving ${this.indexFilename}:`, err);
        }
    }

    #extractFilenameFromUrl(url) {
        const functionName = 'extractFilenameFromUrl';
        try {
            const parsedUrl = new URL(url);
            const pathname = parsedUrl.pathname;
            const filename = path.basename(pathname);
            return sanitizeFilename(filename);
        } catch (err) {
            reportError(__line, functionName, `Error extracting filename from ${global.colors.FgYellow}${url}${global.colors.Reset}:`, err);
            return 'unknown';
        }
    }

    saveAttachments(message) {
        const functionName = 'saveAttachments';
        try {
            if (!message.attachments || message.attachments.size === 0) return;
            for (const attachment of message.attachments.values()) {
                const url = attachment.url;
                const originalFilename = this.#extractFilenameFromUrl(url);
                const filename = `${message.channel.id}.${message.id}.${originalFilename}.${path.extname(originalFilename)}`;
                downloadFile(url, path.join(this.downloadsPath, filename));
                this.index[message.id] = {
                    type: attachment.contentType ? attachment.contentType.split('/')[0] : 'file',
                    filename: filename,
                    url: url,
                    authorId: message.author.id
                };
            }
        } catch (err) {
            reportError(__line, functionName, err);
        }
    }

    getAttachments(messageId) {
        const functionName = 'getAttachments';
        try {
            return this.index[messageId];
        } catch (err) {
            reportError(__line, functionName, err);
            return [];
        }
    }
}

module.exports = AttachmentsManager;
