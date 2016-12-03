import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

var cytoscape = require('cytoscape');





import './main.html';

Session.setDefault('selectedGeneName', '');
Session.setDefault('selectedAnalysisID', '');

Template.interaction.onCreated(function(){
    this.interactionData = new ReactiveVar(null);

    this.autorun( () => {
        this.subscribe('AnalysisCollection');
        this.subscribe('GeneCollection', Session.get('selectedAnalysisID'));
    }); 
    
});


Template.interaction.onRendered(function(){
	let self = this;

	self.autorun(function() {
		let data = self.interactionData.get();

		if (data != null) {
			// do stuff
			var networkElements = []
			var centralGene = Session.get('selectedGeneName');
			
			networkElements.push({
				group: 'nodes',
				data: { id: centralGene}
			});


			data.forEach(function(d, i) {
				var node = {
					group: 'nodes',
					data: { id: d._id }
				};

				var pubs = [];
				d.pid.forEach(function(p){
					p.forEach(function(d){
						if (pubs.indexOf(d) === -1) {
							pubs.push(d);
						}
					});
				})

				var edge = {
					group: 'edges',
					data: {
						id: i,
						source: centralGene,
						target: d._id,
						score: d.score,
						publications: pubs
					}
				};

				networkElements.push(node);
				networkElements.push(edge);
			})

			
			var cy = cytoscape({
				container: document.getElementById('cy'),
				elements: networkElements,
				layout: {
					name: 'concentric',
				},
				zoom: 1,
				wheelSensitivity: 0.1,
				style: [ 
				{
					selector: 'node',
					style: {
						'background-color': '#666',
						'content': 'data(id)'
					}
				},
				{
					selector: 'edge',
					style: {
						'curve-style': 'haystack',
						'haystack-radius': 0,
                        'opacity': 0.5
					}
				}],			
			});
			
			
			cy.style().selector('edge').style({
				'width': function( ele ){
					var sc = ele.data().score;
					if (sc != null) {
						return 10*sc + 1;
					}
					else {
						return 1;
					} 
				},
				'line-color': function( ele ) {
					var sc = ele.data().score;
					if (sc != null) {
						return 'green';
					}
					else {
						return 'red';
					} 
				}
			}).update();

			
			cy.on('click', 'edge', function(event){
				var edge = event.cyTarget;
				Session.set('edgeScore', edge.data().score);
				Session.set('edgePubs', edge.data().publications);
				Session.set('targetName', edge.data().target);
				Modal.show('myModal');
			})
		}
	})
})

Template.interaction.helpers({
	'geneID': function() {
		var names = GeneCollection.find({},{'_id': 0, 'core.id.symbol': 1}).fetch();
		return names;
	},

	'analysisID': function() {
		return AnalysisCollection.find({}, {'metadata.name': 1});
	},

	'isAnalysisSelected': function() {
		return !Session.equals('selectedAnalysisID', '');
	}
});


Template.interaction.events({
	'change #selectAnalysis': function(event,template) {
		event.preventDefault();
		var selectedAnalysis = event.currentTarget.value;
		Session.set('selectedAnalysisID', selectedAnalysis);
	},
	'change #selectGene': function(event, template) {
		event.preventDefault();

		var selectedName = event.currentTarget.value;
		if (selectedName !== '') {
			Session.set('selectedGeneName', selectedName);
			var anID = Session.get('selectedAnalysisID');
			Meteor.call('fetchData', selectedName, Session.get('selectedAnalysisID'), function (error,result) {
				template.interactionData.set(result);
			});
		}
	}
})


Template.myModal.helpers({
	'score': function() {
		return Session.get('edgeScore');
	},
	'pubs': function() {
		var publications = Session.get('edgePubs');
		return publications;
	},
	'name': function() {
		return Session.get('targetName');
	} 
})




