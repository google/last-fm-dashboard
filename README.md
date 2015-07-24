GCP Hackathon project to visualize scrobbles over time

**This is not an official Google product (experimental or otherwise), it is just code that happens to be owned by Google.**

To run locally

*setup python environment and dependencies*

	pip install -r backend/requirements.txt -t backend/lib
	pip install -r frontend/requirements.txt -t frontend/lib


*setup javascript dependencies*

	cd frontend
	npm install
	bower install
	grunt

*Add your Last.fm API key in backend/backend.yaml*

*run the app engine dev-server*

	python {$CloudSDK$}/google_appengine/dev_appserver.py dispatch.yaml backend/backend.yaml frontend/frontend.yaml
