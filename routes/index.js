
/*
 * GET home page.
 */

exports.index = function(req, res){
	res.render('index', 
		{
			title: 'project dalek',
			t1:req.query.text
		}
	);
};
