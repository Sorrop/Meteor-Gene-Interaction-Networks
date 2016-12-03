import { Meteor } from 'meteor/meteor';



Meteor.publish('GeneCollection', function(analysis){
	if (analysis !== '') {
		console.log(analysis);
		var an_id = new Meteor.Collection.ObjectID(analysis);
		return GeneCollection.find({
			analysis_id: an_id, 
			$or: [{
					"interaction.cons_path_db": {$not : { $type : 10 }}
				},
				{
					"interaction.biogrid": {$not : { $type : 10 }}
				},
				{
					"interaction.intact": {$not : { $type : 10 }}
				}]
			});
	}
})


Meteor.publish('AnalysisCollection', function(){
	return AnalysisCollection.find({});
})


Meteor.methods({
	'fetchData': function(gene,analysis) {

		var data = [];
		

		var properID = new Meteor.Collection.ObjectID(analysis);
		var aggr_id = new MongoInternals.NpmModule.ObjectID(properID._str);
		
		var pipeline = [
			{
				$match:  {
					"core.id.symbol": gene,
					"analysis_id": aggr_id
				}
			},
			{
				$project: {
					"interaction.cons_path_db": { $ifNull: [ "$interaction.cons_path_db", [null] ] },
					"interaction.biogrid": { $ifNull: [ "$interaction.biogrid", [null] ] },
					"interaction.intact": { $ifNull: [ "$interaction.intact", [null] ] }
				}
			},
			{
				$project: {
					interactions: {
						$concatArrays: ["$interaction.cons_path_db", "$interaction.biogrid","$interaction.intact"]
					}
				}
			},
			{
				$unwind: "$interactions"
			},
			{
				$group: {
					_id: "$interactions.gene",
					score: { $first: "$interactions.score" },
					pid: { $addToSet: "$interactions.pid" }
				}
			}
		];

		GeneCollection.aggregate(pipeline).forEach( function(d){
			if (d._id !== null) {
				data.push(d);
			}
		});

		return data;
	}
});


Meteor.startup(() => {
  // code to run on server at startup
});
