identifier=com.imshenshen.PawExtensions.JDCloudSignature2DynamicValue
extensions_dir=$(HOME)/Library/Containers/com.luckymarmot.Paw/Data/Library/Application Support/com.luckymarmot.Paw/Extensions/

build:
	npm install
	npm run build
	cp README.md ./dist/

clean:
	rm -Rf ./dist/

install: clean build
	mkdir -p "$(extensions_dir)$(identifier)/"
	cp -r ./dist/* "$(extensions_dir)$(identifier)/"

test:
	npm test

archive: build
	cd ./build/; zip -r JDCloudSignature2DynamicValue.zip "./"
