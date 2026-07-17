function parseNode(node, mapping, indent = 0) {
    let message = node.message;
    if (message != null) {
        console.log(`${'  '.repeat(indent)}${message.author.role}: ${message.content.parts[0]}`);
    }
    for (let childId of node.children) {
        parseNode(mapping[childId], mapping, indent + 1);
    }
}

function parseConversation(conversation) {
    let rootId = Object.keys(conversation.mapping).find(nodeId => conversation.mapping[nodeId].parent === null);
    parseNode(conversation.mapping[rootId], conversation.mapping);
}

let conversations = this.udr("#console #console")[0];

for (let conversation of conversations) {
    console.log(`Conversation: ${conversation.title}`);
    parseConversation(conversation);
    console.log();
}
