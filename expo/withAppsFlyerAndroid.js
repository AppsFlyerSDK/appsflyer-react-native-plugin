const {withMainActivity} = require('@expo/config-plugins')

function overrideOnNewIntent(contents, packageName = ''){
    let nextContent = contents
    const intentImportString = 'import android.content.Intent'

    if (!nextContent.includes(intentImportString)){
        const packageString = `${packageName}\n`
        nextContent = nextContent.replace(packageString,`${packageString}\n${intentImportString}`)
    }

    if (!nextContent.includes('override fun onNewIntent(intent: Intent?)')) {
        const classDeclarationRegex = /class\s+\w+.*\{/
        nextContent = nextContent.replace(
            classDeclarationRegex,
            match=>`${match}
  override fun onNewIntent(intent: Intent?) {
    super.onNewIntent(intent)
    setIntent(intent)
  }      
`)
    }
    return nextContent
}

module.exports = function withAppsFlyerAndroid(config){
    return withMainActivity(config, function(config){
        const {modResults:{contents},android} = config
        config.modResults.contents = overrideOnNewIntent(contents,android?.package)
        return config
    })
}
