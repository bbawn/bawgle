import boggle
import cgi
import datetime
import jinja2
import os
import pprint
import string
import sys
import urllib
import webapp2

jinja_environment = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)))

dictionary = boggle.Dictionary('./words')
game = boggle.Game(dictionary)

class MainPage(webapp2.RequestHandler):
    def get(self):
        letters = self.request.get('letters')
        if len(letters) > 0:
            game.set(letters)
        else:
            game.shake()
        if self.request.get('solve'):
            answers = game.solve()
        else:
            answers = ''

        self.render(answers)
        
        template_values = {
            'rank': boggle.rank,
            'letters': game.letters,
            'answers': answers
        }

        # template = jinja_environment.get_template('index.html')
        # self.response.out.write(template.render(template_values))

    def render_text(self, answers):
        self.response.headers['Content-Type'] = 'text/plain'
        out = self.response.out
        #game.dump(out)
        out.write(game.letters)
        i = 0
        for let in game.letters:
            if i % boggle.rank == 0:
                out.write(let + '\n')
        answers = game.solve()
        out.write('\nSCORE: ' + str(boggle.score(answers)) + '\n')
        out.write('\nSOLUTION:' + '\n')
        pp = pprint.PrettyPrinter(indent=1, width=80, depth=None, stream=out)
        pp.pprint(answers)

    def render(self, answers):
        self.response.headers['Content-Type'] = 'text/html'
        out = self.response.out
        out.write('''
            <!DOCTYPE html>
            <html>
              <head>
                <link type="text/css" rel="stylesheet" href="/stylesheets/main.css" />
                <title>Bawgle</title>
              </head>
              <body>
                <div id="grid">
                  <form action="" method="get">
                    <input type="submit" value="Shake">
                  </form>
                  <form action="" method="get">
                    <input name="solve" type="hidden" value="1">
                    <input name="letters" type="hidden" value="''')
        out.write(string.join(game.letters, ''))
        out.write('''">
                    <input type="submit" value="Solve">
                  </form>
                <table>''')
        for i in range(len(game.letters)):
            if i % boggle.rank == 0:
                out.write("""
                  <tr>""")
            out.write("""
                    <td>""" + game.letters[i] + "</td>")
            if i % boggle.rank == boggle.rank - 1:
                out.write("""
                  </tr>""")
        out.write("""
                </table>
                </div>
                <div id="answers">""")
        for a in sorted(answers):
            out.write("""
                <br>
                """ + a)
            if answers[a] > 1:
                out.write(' (' + str(answers[a]) + ')')
        if len(answers) > 0:
            out.write("""
                <p>SCORE: """ + str(boggle.score(answers)) + " </p>\n")
        out.write("""
                </div>
              </body>
            </html>""")


app = webapp2.WSGIApplication([('/', MainPage)],
                              debug=True)
