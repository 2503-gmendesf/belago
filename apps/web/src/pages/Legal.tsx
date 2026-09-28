export function Legal() {
  return (
    <div className="legal-page">
      <header className="legal-top">
        <div className="top-inner">
          <div className="wordmark">
            Bela<em>Go</em>
          </div>
          <div className="top-meta">
            Privacidade &amp; Termos de Uso
            <br />
            Vigência: 1 de setembro de 2026
          </div>
        </div>
      </header>

      <div className="shell layout">
        <nav className="toc">
          <p className="toc-eyebrow">Neste documento</p>
          <a className="doc-switch" href="#privacidade">
            Política de Privacidade
          </a>
          <a href="#p-quais-dados">Quais dados coletamos</a>
          <a href="#p-como-usamos">Como usamos</a>
          <a href="#p-compartilhamento">Compartilhamento</a>
          <a href="#p-seguranca">Segurança e retenção</a>
          <a href="#p-direitos">Seus direitos (LGPD)</a>
          <a href="#p-exclusao">Excluir sua conta</a>
          <a href="#p-criancas">Menores de idade</a>
          <a href="#p-contato">Contato</a>
          <a className="doc-switch" href="#termos" style={{ marginTop: 18 }}>
            Termos de Uso
          </a>
          <a href="#t-servico">O serviço</a>
          <a href="#t-contas">Contas e cadastro</a>
          <a href="#t-pagamentos">Pagamentos e cancelamentos</a>
          <a href="#t-responsabilidades">Responsabilidades</a>
          <a href="#t-suspensao">Suspensão e encerramento</a>
          <a href="#t-gerais">Disposições gerais</a>
        </nav>

        <main>
          <section id="privacidade">
            <div className="doc-head">
              <h1>Política de Privacidade</h1>
              <p>Como o BelaGo coleta, usa e protege os dados de clientes e profissionais na plataforma.</p>
              <span className="badge">Conforme a LGPD — Lei nº 13.709/2018</span>
            </div>

            <p>
              O BelaGo é uma plataforma que conecta clientes a profissionais de beleza autônomas para agendamento de
              serviços de estética, cabelo, unhas e afins. Esta política descreve, em linguagem direta, quais dados
              tratamos e por quê.
            </p>

            <section id="p-quais-dados">
              <h2>
                <span className="n">01</span> Quais dados coletamos
              </h2>
              <table>
                <tbody>
                  <tr>
                    <th>Categoria</th>
                    <th>Exemplos</th>
                    <th>Quando</th>
                  </tr>
                  <tr>
                    <td>Identificação</td>
                    <td>Nome, e-mail, telefone, foto de perfil, gênero, data de nascimento</td>
                    <td>No cadastro</td>
                  </tr>
                  <tr>
                    <td>Localização</td>
                    <td>Endereços salvos para atendimento a domicílio</td>
                    <td>Ao salvar um endereço ou agendar</td>
                  </tr>
                  <tr>
                    <td>Agendamento</td>
                    <td>Serviços escolhidos, datas, horários, avaliações, mensagens de chat</td>
                    <td>Ao usar o app</td>
                  </tr>
                  <tr>
                    <td>Profissional</td>
                    <td>Especialidade, bio, chave PIX, disponibilidade, comprovantes de verificação</td>
                    <td>Cadastro como profissional</td>
                  </tr>
                  <tr>
                    <td>Pagamento</td>
                    <td>Método escolhido (PIX/cartão) e status da transação</td>
                    <td>Ao confirmar um agendamento</td>
                  </tr>
                  <tr>
                    <td>Uso do app</td>
                    <td>Dispositivo, sistema operacional, registros de erro</td>
                    <td>Automaticamente</td>
                  </tr>
                </tbody>
              </table>
              <p>
                Não armazenamos números completos de cartão de crédito — o processamento de pagamento é feito por
                provedores parceiros especializados, que seguem seus próprios padrões de segurança (PCI-DSS).
              </p>
            </section>

            <section id="p-como-usamos">
              <h2>
                <span className="n">02</span> Como usamos seus dados
              </h2>
              <ul>
                <li>Conectar clientes e profissionais e viabilizar o agendamento de serviços;</li>
                <li>Processar pagamentos e calcular repasses às profissionais;</li>
                <li>Enviar notificações sobre agendamentos, confirmações e lembretes;</li>
                <li>Exibir avaliações e histórico de atendimentos;</li>
                <li>Prevenir fraude e garantir a segurança da conta (autenticação, detecção de acessos incomuns);</li>
                <li>Cumprir obrigações legais e responder a autoridades quando exigido por lei.</li>
              </ul>
            </section>

            <section id="p-compartilhamento">
              <h2>
                <span className="n">03</span> Com quem compartilhamos
              </h2>
              <p>
                O BelaGo <strong>não vende</strong> dados pessoais. Compartilhamos o mínimo necessário com:
              </p>
              <ul>
                <li>
                  <strong>A outra parte do agendamento</strong> — a profissional vê o nome e endereço do cliente para
                  o atendimento; o cliente vê o nome e avaliação da profissional;
                </li>
                <li>
                  <strong>Provedores de infraestrutura</strong> — hospedagem de banco de dados e autenticação
                  (Supabase) e provedores de pagamento, sob contrato de confidencialidade;
                </li>
                <li>
                  <strong>Provedores de login social</strong> — Google e Apple, apenas quando você escolhe entrar com
                  essas contas;
                </li>
                <li>
                  <strong>Autoridades</strong> — quando exigido por ordem judicial ou obrigação legal.
                </li>
              </ul>
            </section>

            <section id="p-seguranca">
              <h2>
                <span className="n">04</span> Segurança e retenção
              </h2>
              <p>
                Aplicamos controles de acesso por linha (Row Level Security) no banco de dados, de forma que cada
                pessoa só acessa os dados aos quais tem direito, e toda comunicação com nossos servidores é
                criptografada em trânsito (HTTPS/TLS).
              </p>
              <p>
                Mantemos os dados enquanto sua conta estiver ativa. Após a exclusão da conta, os dados pessoais são
                apagados em até <strong>7 dias</strong>, exceto registros que a legislação fiscal ou de defesa do
                consumidor exija manter por período legal (por exemplo, histórico de transações financeiras).
              </p>
            </section>

            <section id="p-direitos">
              <h2>
                <span className="n">05</span> Seus direitos (LGPD)
              </h2>
              <p>Você pode, a qualquer momento:</p>
              <ul>
                <li>Confirmar a existência de tratamento e acessar seus dados;</li>
                <li>Corrigir dados incompletos, inexatos ou desatualizados diretamente no app;</li>
                <li>Solicitar a portabilidade dos seus dados a outro fornecedor;</li>
                <li>Solicitar a exclusão dos dados tratados com base no seu consentimento;</li>
                <li>Revogar o consentimento e se opor a tratamentos realizados sem sua permissão.</li>
              </ul>
            </section>

            <section id="p-exclusao">
              <h2>
                <span className="n">06</span> Como excluir sua conta
              </h2>
              <div className="callout">
                <strong>Direto pelo app:</strong> Perfil → Privacidade e Termos → Excluir minha conta. O pedido é
                registrado imediatamente e o processamento é concluído em até 7 dias.
              </div>
              <p>
                Você também pode solicitar por e-mail em{' '}
                <a href="mailto:privacidade@belago.app">privacidade@belago.app</a>, informando o e-mail cadastrado.
              </p>
            </section>

            <section id="p-criancas">
              <h2>
                <span className="n">07</span> Uso por menores de idade
              </h2>
              <p>
                O BelaGo é destinado a pessoas com 18 anos ou mais. Não coletamos intencionalmente dados de menores de
                idade. Se identificarmos uma conta de menor de idade, ela será encerrada e os dados excluídos.
              </p>
            </section>

            <section id="p-contato">
              <h2>
                <span className="n">08</span> Contato e alterações
              </h2>
              <p>
                Dúvidas sobre privacidade: <a href="mailto:privacidade@belago.app">privacidade@belago.app</a>. Esta
                política pode ser atualizada; alterações relevantes serão comunicadas dentro do app antes de entrarem
                em vigor.
              </p>
            </section>
          </section>

          <div className="divider" />

          <section id="termos">
            <div className="doc-head">
              <h1>Termos de Uso</h1>
              <p>As regras de uso da plataforma BelaGo para clientes e profissionais.</p>
            </div>

            <section id="t-servico">
              <h2>
                <span className="n">01</span> O que é o BelaGo
              </h2>
              <p>
                O BelaGo é uma plataforma de intermediação que conecta clientes a profissionais de beleza autônomas.{' '}
                <strong>O BelaGo não presta os serviços de beleza</strong> — a execução do serviço (corte, manicure,
                sobrancelha, etc.) é de responsabilidade exclusiva da profissional contratada, que atua como
                prestadora independente, sem vínculo empregatício com o BelaGo.
              </p>
            </section>

            <section id="t-contas">
              <h2>
                <span className="n">02</span> Contas e cadastro
              </h2>
              <p>
                Para usar o BelaGo você deve ter 18 anos ou mais e fornecer informações verdadeiras. Você é
                responsável por manter a confidencialidade da sua senha e por toda atividade realizada na sua conta.
              </p>
              <p>
                Profissionais passam por um processo de verificação antes de aparecerem como ativas na busca; o
                BelaGo pode solicitar documentos comprobatórios de qualificação.
              </p>
            </section>

            <section id="t-pagamentos">
              <h2>
                <span className="n">03</span> Pagamentos e cancelamentos
              </h2>
              <ul>
                <li>Pagamentos podem ser feitos via PIX ou cartão, processados por provedores parceiros;</li>
                <li>O BelaGo retém uma comissão sobre cada agendamento concluído para manter a plataforma;</li>
                <li>
                  Atendimentos a domicílio podem ter uma taxa de deslocamento adicional, exibida antes da
                  confirmação;
                </li>
                <li>
                  Cancelamentos com pouca antecedência podem estar sujeitos a uma taxa, exibida na tela de
                  agendamento antes da confirmação;
                </li>
                <li>Repasses às profissionais são processados periodicamente, conforme o painel financeiro de cada uma.</li>
              </ul>
            </section>

            <section id="t-responsabilidades">
              <h2>
                <span className="n">04</span> Responsabilidades
              </h2>
              <p>
                Clientes e profissionais concordam em: fornecer informações verdadeiras; tratar a outra parte com
                respeito; comparecer aos horários agendados ou cancelar com antecedência; e usar o chat do app apenas
                para assuntos relacionados ao agendamento.
              </p>
              <p>
                O BelaGo não se responsabiliza pela qualidade técnica dos serviços prestados pelas profissionais, mas
                mantém um sistema de avaliações e um canal de disputas para resolver problemas relatados por qualquer
                uma das partes.
              </p>
            </section>

            <section id="t-suspensao">
              <h2>
                <span className="n">05</span> Suspensão e encerramento
              </h2>
              <p>
                Contas que violem estes termos — fraude, assédio, dados falsos ou tentativa de burlar pagamentos pela
                plataforma — podem ser suspensas ou encerradas. Você pode encerrar sua conta a qualquer momento pelo
                app, conforme descrito na Política de Privacidade.
              </p>
            </section>

            <section id="t-gerais">
              <h2>
                <span className="n">06</span> Disposições gerais
              </h2>
              <p>
                Estes termos são regidos pelas leis da República Federativa do Brasil. Havendo dúvidas ou conflitos,
                buscamos resolução direta pelo canal de suporte antes de qualquer medida judicial, que ficará a cargo
                do foro da comarca de domicílio do usuário, conforme o Código de Defesa do Consumidor.
              </p>
              <p>
                O BelaGo pode atualizar estes termos; alterações relevantes serão comunicadas dentro do app com
                antecedência razoável.
              </p>
            </section>
          </section>

          <footer className="legal-footer">
            <span>© 2026 BelaGo. Todos os direitos reservados.</span>
            <span>privacidade@belago.app</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
