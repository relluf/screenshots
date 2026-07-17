"use marked";


/*- 

2024/06/16 load conversations dynamically (stop unrequire-pattern)
2023/10/14 What about?
	* automatically selecting last export

2023/09/13 - fixed some issues with searching/matching 

*/

const marked = require("marked");
const parseNode = (node, mapping, text, indent = 0) => {
    let message = node.message;
    if (message !== null) {
    	if(message.content.parts) {
        	text.push(`**${message.author.role}**: ${message.content.parts[0]}\n`);
    	}
    }
    for (let childId of node.children) {
        parseNode(mapping[childId], mapping, text, indent + 1);
    }
};
const parseConversation = (conversation, text) => {
    let rootId = Object.keys(conversation.mapping).find(nodeId => conversation.mapping[nodeId].parent === null);

    parseNode(conversation.mapping[rootId], conversation.mapping, text = text || []);
    return text.join("");
};
const normalize = (uri, module) => {
	if(module.includes("!")) {
		module = module.split("!");
		module[1] = js.normalize(uri, module[1]);
		module = module.join("!");
	} else {
		module = js.normalize(uri, module);
	}
	return module;
};

["devtools/Alphaview<>", { }, [
	[("#load"), {
		on() {
			const array = this.ud("#array");
			array.setArray([{}]); array.setBusy(true);
			
			const conversations_json_url = this['@factory']._parentRequire.toUrl("./HEAD/conversations.json");
			fetch(js.sf("/home/%s?%s", conversations_json_url.replace(/^cavalion\-blocks\//, "").replace(/^\$HOME\//, ""), Date.now()))
				.then(res => res.json())
				.then(conversations => {
					conversations.forEach(c => {
						if(typeof c.create_time === "number") {
							c.create_time = new Date(c.create_time * 1000);
						}
						if(typeof c.update_time === "number") {
							c.update_time = new Date(c.update_time * 1000);
						}
					});
					this.vars("sel", [conversations]);
					
					array.setBusy(false);
					this.inherited(arguments);
				});
		}
	}],
	
	[("#array"), {
		vars: {
			match: (obj, q) => {
				for(var k in obj.mapping) {
					var message = obj.mapping[k].message;
					var parts = js.get("content.parts", message);
					if(parts) {
						var part = parts[0];
						if(typeof part === "string" && part.toLowerCase().includes(q.toLowerCase())) {
							return true;
						}
					}
				}
				return false;
			}
		}
	}],
	
	[("#list"), {
		onSelectionChange() {
			const markdown = [];
			const sel = this.getSelection(true);
			const preview = this.ud("#preview");
			
			const q = this.ud("#array").vars("q");
			const highlight = (markdown) => {
				if(!q) return markdown;
				
				const regex = new RegExp(q, "gi");
				
				return markdown.replace(regex, (match) => {
					return '<span class="highlight">' + match + '</span>';
				});
			};
			
			preview.setVisible(sel.length > 0);
			sel.forEach(conversation => {
				if(conversation.parsed === undefined) {
					let text = conversation.parsed = [];
				    text.push(`# ${conversation.title}`);
				    parseConversation(conversation, text);
				}
			    markdown.push(conversation.parsed.join("\n"));
			});
		    preview.getClientNode().innerHTML = highlight(marked.marked(markdown.join("\n")));

		    if(q) {
				this.setTimeout("update", () => preview.getClientNode().qsa(".highlight")[0]?.scrollIntoView());
		    }	
		    
		    return this.inherited(arguments);
		}
	}],
	
	["Executable", ("open"), {
		hotkey: "MetaCtrl+Alt+O",
		parent: "selection-available",
		on() {
			this.ud("#list").getSelection(true).forEach(c => window.open(`https://chat.openai.com/c/${c.id}`));
		}
	}],
	
	["Container", ("preview"), {
		align: "right", width: 600,
		css: { '': "padding: 16px;", '.highlight': "background-color: yellow;" },
		visible: false
	}]
]];