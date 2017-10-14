# Usage: python boggle.py [letters-in-grid]
# Play boggle: if no arguments, solve a random shake game,
# otherwise solve a game with given letter string. q means qu.

import random
import re
import pprint
import sys

rank = 5
min_len = 4
# random.seed(43)

def nletters():
    return rank*rank

# Pre-calculated indexes neighboring each index
neighbors = []
def init_neighbors():
    # Return list of indexes that neighbor a given index
    # in the grid
    for i in range(nletters()):
        ineighbors = []
        if i % rank != 0:           
            ineighbors.append(i-1)  # add left
        if i % rank != (rank-1):
            ineighbors.append(i+1)  # add right
        if i >= rank != 0:           
            above = i-rank
            ineighbors.append(above)    # add above
            if above % rank != 0:           
                ineighbors.append(above-1)  # add above left
            if above % rank != (rank-1):
                ineighbors.append(above+1)  # add above right
        if i < rank*(rank-1):           
            below = i+rank
            ineighbors.append(below)  # add below
            if below % rank != 0:           
                ineighbors.append(below-1)  # add below left
            if below % rank != (rank-1):
                ineighbors.append(below+1)  # add below right
        neighbors.append(ineighbors)

init_neighbors()

class Game:
    """ A round of Boggle."""

    # Each cube has 6 faces, each with a letter
    cubes = [u'eeeeam', u'oooutt', u'setcpi', u'asairf', u'yrrphi',
             u'hhldro', u'cpilet', u'eeumga', u'eeeeaa', u'hrlond', 
             u'sssune', u'thhodn', u'afirys', u'menang', u'fiyspr',
             u'deannn', u'rrvgwo', u'sctncw', u'ddornl', u'faaars',
             u'ciietl', u'tttoem', u'iiiett', u'touown', u'kzxqbj']

    def __init__(self, dictionary):
        self.letters = None
        self.dictionary = dictionary
 
    def shake(self):
        """ Set game grid to random shuffle of random cube face letters."""
        self.letters = []
        indexes = list(range(nletters()))
        random.shuffle(indexes)
        for i in indexes:
            letter = Game.cubes[i][random.randrange(6)]
            if letter == u'q':               # q is really qu
                letter += u'u'
            self.letters.append(letter)
    
    def set(self, letters):
        """ Set game grid to given letter list (not string because qu)."""
        if len(letters) != nletters():
            raise ValueError('Invalid letters: ' + str(letters) + ' len: ' + 
                             str(len(letters)) + ' must be of length ' + str(nletters()))
        self.letters = letters

    def dump(self, stream=sys.stdout):
        stream.write(u"GAME:\n")
        for row in range(rank):
            stream.write(unicode(self.letters[row*rank:(row+1)*rank]) + u'\n')

    def solve(self):
        """ Return return dictionary (key: word, value: count) of all
        words in the solution
        """

        # Track used indexes to prevent cycles
        self.answers = {}
        for i in range(nletters()):
            self.used_indexes = []
            self.solve_sub(self.letters[i], i)
        return self.answers

    def solve_sub(self, prefix, index):
        """ Add words with given prefix followed by suffix starting
        at index to solution set
        """
        self.used_indexes.append(index)
        if prefix[-1] == u'q':               # q is really qu
            prefix += u'u'
        node = self.dictionary.find(prefix)
        if node == None:
            self.used_indexes.pop()
            return
        if node.isword and len(prefix) >= min_len:
            self.add_word(prefix)
        for i in neighbors[index]:
            if i not in self.used_indexes:
                new_prefix = prefix + self.letters[i]
                self.solve_sub(new_prefix, i)
        self.used_indexes.pop()

    def add_word(self, word):
        if word not in self.answers:
            self.answers[word] = 1
        else:
            self.answers[word] += 1
            
class Node:
    """ Trie node for dictionary."""

    def __init__(self, letter, isword):
        self.letter = letter
        self.isword = isword
        self.kids = []

    def find(self, letter):
        # Linear search (PERF: is binary better?)
        for k in self.kids:
            if k.letter == letter:
                return k
        return None
        
    def add(self, letter, isword):
        node = self.find(letter)
        if node == None:
            node = Node(letter, isword)
            self.kids.append(node)
        if isword:
            node.isword = True
        return node

    def dump(self, stream=sys.stdout, indent=0):
        line = u' '*indent
        if self.isword:
            line += u'*'
        else:
            line += u' '

        line += self.letter + u": "
        for k in self.kids:
            line += k.letter 
        stream.write(line + u'\n')
        indent += 1
        for k in self.kids:
            k.dump(stream, indent)

class Dictionary:
    """ Collection of words that allows prefix lookup."""

    def __init__(self, file=u'dict/en_US/en_US_dic_utf-8.txt'):
        self.root = Node('', False)
        letters_re = re.compile(u"[^a-z]")
        with open(file, u'r') as f:
            for line in f:
                line = line.rstrip().lower()
                # Skip words with non-letters
                if letters_re.search(line):
                     continue
                # PERF: slow! O(m*n) for word len m, n words
                self._add(line)

    def __contains__(self, word):
        node = self.find(word)
        if node != None:
            return node.isword
        else:
            return False

    def _add(self, word):
        node = self.root
        for letter in word[0:-1]:
            node = node.add(letter, False)
        node = node.add(word[-1], True)

    def find(self, word):
        """ Return node for given prefix."""
        node = self.root
        for letter in word:
            node = node.find(letter)
            if node == None:
                break
        return node

    def dump(self, stream=sys.stdout):
        """ Print nodes."""
        self.root.dump()

def score(answers):
    """ Return score for given answers set."""
    score_for_len = [0, 0, 0, 0, 1, 2, 3, 5, 11]
    total = 0
    for word in answers.keys():
        l = len(word)
        if answers[word] == 0:  # invalid ("crossed-out") word
            continue
        if l >= len(score_for_len):
            total += score_for_len[-1]
        else:
            total += score_for_len[l]
    return total

if __name__ == "__main__":
    def main():
        game = Game(Dictionary())
        if len(sys.argv) > 1:
            game.set(sys.argv[1])
        else:
            game.shake()
        game.dump(sys.stdout)
        answers = game.solve()
        print(u'\nSCORE: ' + unicode(score(answers)))
        print(u'\nSOLUTION:')
        pprint.pprint(answers)

    main()
