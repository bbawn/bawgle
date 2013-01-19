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

def cross_out(answers, user_words):
    # Return dictionary of user_words. Value 0 if the
    # word appears in answers or is not in dictionary
    words = {}
    for u in user_words:
        u = string.lower(u)
        # Go ahead and count words that are in answers or else human
        # always scores 0!
        # if u not in answers and u in dictionary:
        if u in dictionary and len(u) > 3:
            words[u] = 1
        else:
            words[u] = 0
    sys.stderr.write('words:' + str(words) + '\n')
    return words

class MainPage(webapp2.RequestHandler):
    def get(self):
        letters = self.request.get('letters')
        words = {}
        if len(letters) > 0:
            game.set(letters)
        else:
            game.shake()
        if self.request.get('solve'):
            answers = game.solve()
            user_words = self.request.get('words').split()
            words = cross_out(answers, user_words)
        else:
            answers = None

        self.render(answers, words)
        
        template_values = {
            'rank': boggle.rank,
            'letters': game.letters,
            'answers': answers
        }

        # template = jinja_environment.get_template('index.html')
        # self.response.out.write(template.render(template_values))

    def render(self, answers, words):
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
                  <ul>
                  <li>
                  <form action="" method="get">
                    <input type="submit" value="Shake">
                  </form>
                  </li>
                  <li>
                  <form name="play" action="" method="get">
                    <input name="letters" type="hidden" value="''')
        out.write(string.join(game.letters, ''))
        out.write('''">
                    <input type="submit" value="Solve">
                    <input name="solve" type="hidden" value="1">
                  </li>
                  </ul>
                <table>''')
        for i in range(len(game.letters)):
            let = game.letters[i]
            if let == 'q':
                let += 'u'
            if i % boggle.rank == 0:
                out.write("""
                  <tr>""")
            out.write("""
                    <td>""" + string.upper(let) + "</td>")
            if i % boggle.rank == boggle.rank - 1:
                out.write("""
                  </tr>""")

        col = 0
        out.write("""
                </table>
                </div>
                <div id="col0">""")
        if answers != None:
            out.write("YOUR WORDS (" + str(len(words)) + "):")
            for w in sorted(words):
                if words[w] == 0:
                    out.write('<br><del>' + w + '</del>')
                else:
                    out.write("<br>" + w)
            word_score = boggle.score(words)
            out.write("""
                <p>SCORE: """ + str(word_score) + " </p>\n")
        else:
            out.write("""
                YOUR WORDS:
                    <textarea name="words" cols=24 rows=40></textarea name>
                  </form>""")
        
        # answers = {str(1000+j):1 for j in range(75)}
        out.write("""
                </div>
                <div id="col1">""")
        if answers != None:
            out.write("ANSWERS (" + str(len(answers)) + "):")
            lines_per_col = max(25, (len(answers)+7)/3)
            i = 0
            col = 2
            for a in sorted(answers):
                if i % lines_per_col == lines_per_col - 1:
                    out.write('</div><div id="col''' + str(col) + '">')
                    col += 1
                    i += 1
                out.write("<br>" + a)
                if answers[a] > 1:
                    out.write(' (' + str(answers[a]) + ')')
                i += 1
            answer_score = boggle.score(answers)
            out.write("""
                <p>SCORE: """ + str(answer_score) + " </p>\n")
        out.write("""
                </div>
              </body>
            </html>""")

app = webapp2.WSGIApplication([('/', MainPage)],
                              debug=True)
